import { getCatalogProducts, getDimensionCatalog, type CatalogProduct } from "./catalog";

export type FlowProduct = {
  id: string;
  title: string;
  brand: string;
  model: string;
  dimensionLabel: string;
  width: string;
  profile: string;
  rim: string;
  fuelRating: string;
  gripRating: string;
  noiseDb: number;
  noiseClass: string;
  price: number;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  stockCount: number;
  imageUrl: string;
  imageAlt: string;
  storyNo: string;
  storyEn: string;
  variantId?: string;
  availableForSale?: boolean;
  checkoutQuantityLimit?: number;
};

export type FlowDimensions = {
  widths: string[];
  profilesByWidth: Record<string, string[]>;
  rimsByWidthProfile: Record<string, string[]>;
};

export type FlowShop = {
  id: string;
  nameNo: string;
  nameEn: string;
  address: string;
  availabilityNo: string;
  availabilityEn: string;
};

export type FlowBootstrap = {
  source: "shopify" | "spreadsheet";
  products: FlowProduct[];
  dimensions: FlowDimensions;
  shops: FlowShop[];
  shopify: {
    enabled: boolean;
    storeDomain: string | null;
    storefrontTokenPresent: boolean;
  };
};

const shops: FlowShop[] = [
  {
    id: "fjellhamar",
    nameNo: "Fjellhamar",
    nameEn: "Fjellhamar",
    address: "Kloppaveien 16, 1472 Fjellhamar",
    availabilityNo: "Mange ledige tider denne uken",
    availabilityEn: "Plenty of slots this week",
  },
  {
    id: "drammen",
    nameNo: "Drammen",
    nameEn: "Drammen",
    address: "Tordenskiolds gate 73, 3044 Drammen",
    availabilityNo: "Mange ledige tider denne uken",
    availabilityEn: "Plenty of slots this week",
  },
];

function toFlowProduct(product: CatalogProduct): FlowProduct {
  return {
    id: product.id,
    title: `${product.brand} ${product.model}`,
    brand: product.brand,
    model: product.model,
    dimensionLabel: product.dimensionLabel,
    width: product.width,
    profile: product.profile,
    rim: product.rim,
    fuelRating: product.fuelRating,
    gripRating: product.gripRating,
    noiseDb: product.noiseDb,
    noiseClass: product.noiseClass,
    price: product.retailPrice,
    stockStatus: product.stockStatus,
    stockCount: product.stockCount,
    imageUrl: "/illustration-tire-card.svg",
    imageAlt: `${product.brand} ${product.model}`,
    storyNo: product.storyNo,
    storyEn: product.storyEn,
    availableForSale: product.stockStatus !== "out-of-stock",
    checkoutQuantityLimit: 4,
  };
}

function buildDimensions(products: FlowProduct[]): FlowDimensions {
  const widths = new Set<string>();
  const profilesByWidth = new Map<string, Set<string>>();
  const rimsByWidthProfile = new Map<string, Set<string>>();

  for (const product of products) {
    widths.add(product.width);

    const profiles = profilesByWidth.get(product.width) ?? new Set<string>();
    profiles.add(product.profile);
    profilesByWidth.set(product.width, profiles);

    const rims = rimsByWidthProfile.get(`${product.width}/${product.profile}`) ?? new Set<string>();
    rims.add(product.rim);
    rimsByWidthProfile.set(`${product.width}/${product.profile}`, rims);
  }

  return {
    widths: Array.from(widths).sort((a, b) => Number(a) - Number(b)),
    profilesByWidth: Object.fromEntries(
      Array.from(profilesByWidth.entries()).map(([width, profiles]) => [
        width,
        Array.from(profiles).sort((a, b) => Number(a) - Number(b)),
      ]),
    ),
    rimsByWidthProfile: Object.fromEntries(
      Array.from(rimsByWidthProfile.entries()).map(([key, rims]) => [
        key,
        Array.from(rims).sort((a, b) => Number(a) - Number(b)),
      ]),
    ),
  };
}

function getSpreadsheetBootstrap(): FlowBootstrap {
  const products = getCatalogProducts().map(toFlowProduct);
  const dimensions = getDimensionCatalog();

  return {
    source: "spreadsheet",
    products,
    dimensions,
    shops,
    shopify: {
      enabled: false,
      storeDomain: import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN ?? null,
      storefrontTokenPresent: Boolean(import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN),
    },
  };
}

type ShopifyProductNode = {
  id: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null } | null;
  variants: {
    edges: Array<{
      node: {
        id: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
      };
    }>;
  };
  metafields: Array<{ key: string; value: string | null } | null>;
};

async function fetchShopifyProducts() {
  const storeDomain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!storeDomain || !token) {
    return null;
  }

  const endpoint = `https://${storeDomain}/api/2025-10/graphql.json`;
  const query = `
    query GetSharifProducts($cursor: String) {
      products(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            title
            descriptionHtml
            vendor
            availableForSale
            featuredImage {
              url
              altText
            }
            variants(first: 5) {
              edges {
                node {
                  id
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
            metafields(
              identifiers: [
                { namespace: "tire", key: "width" }
                { namespace: "tire", key: "profile" }
                { namespace: "tire", key: "rim" }
                { namespace: "tire", key: "eu_rolling_resistance" }
                { namespace: "tire", key: "eu_wet_grip" }
                { namespace: "tire", key: "eu_noise_db" }
                { namespace: "tire", key: "pattern" }
                { namespace: "tire", key: "load_speed" }
              ]
            ) {
              key
              value
            }
          }
        }
      }
    }
  `;

  const nodes: ShopifyProductNode[] = [];
  let cursor: string | null = null;
  let page = 0;

  while (page < 10) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Storefront API failed: ${response.status}`);
    }

    const payload = await response.json();
    const productConnection = payload?.data?.products;
    if (!productConnection) {
      throw new Error("Shopify response missing products connection");
    }

    for (const edge of productConnection.edges ?? []) {
      if (edge?.node) {
        nodes.push(edge.node);
      }
    }

    if (!productConnection.pageInfo?.hasNextPage) {
      break;
    }

    cursor = productConnection.pageInfo.endCursor;
    page += 1;
  }

  return {
    storeDomain,
    products: nodes,
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toShopifyFlowProducts(products: ShopifyProductNode[]): FlowProduct[] {
  return products
    .map((product) => {
      const metafieldMap = new Map(
        product.metafields
          .filter((field): field is { key: string; value: string | null } => Boolean(field?.key))
          .map((field) => [field.key, field.value ?? ""]),
      );

      const width = metafieldMap.get("width")?.trim() ?? "";
      const profile = metafieldMap.get("profile")?.trim() ?? "";
      const rim = metafieldMap.get("rim")?.trim() ?? "";
      const loadSpeed = metafieldMap.get("load_speed")?.trim() ?? "";
      const variant = product.variants.edges[0]?.node;
      const price = variant ? Math.round(Number(variant.price.amount)) : 0;
      const availableForSale = Boolean(product.availableForSale && variant?.availableForSale);
      const stockStatus = availableForSale ? "in-stock" : "out-of-stock";
      const pattern = metafieldMap.get("pattern")?.trim() || product.title;
      const storyBase = stripHtml(product.descriptionHtml);

      if (!width || !profile || !rim || !variant || !price) {
        return null;
      }

      return {
        id: product.id,
        title: product.title,
        brand: product.vendor || "Sharif",
        model: pattern,
        dimensionLabel: `${width}/${profile}R${rim}${loadSpeed ? ` ${loadSpeed}` : ""}`.trim(),
        width,
        profile,
        rim,
        fuelRating: (metafieldMap.get("eu_rolling_resistance") || "D").toUpperCase(),
        gripRating: (metafieldMap.get("eu_wet_grip") || "C").toUpperCase(),
        noiseDb: Number(metafieldMap.get("eu_noise_db") || 71),
        noiseClass: "B",
        price,
        stockStatus,
        stockCount: availableForSale ? 12 : 0,
        imageUrl: product.featuredImage?.url || "/illustration-tire-card.svg",
        imageAlt: product.featuredImage?.altText || product.title,
        storyNo: storyBase || `${product.title} er klar til å gå rett inn i Harriets flyt.`,
        storyEn: storyBase || `${product.title} is ready to drop straight into Harriet's flow.`,
        variantId: variant.id,
        availableForSale,
        checkoutQuantityLimit: 4,
      } satisfies FlowProduct;
    })
    .filter((product): product is FlowProduct => Boolean(product))
    .sort((a, b) => a.price - b.price);
}

export async function getFlowBootstrapData(): Promise<FlowBootstrap> {
  try {
    const shopify = await fetchShopifyProducts();
    if (!shopify || shopify.products.length === 0) {
      return getSpreadsheetBootstrap();
    }

    const products = toShopifyFlowProducts(shopify.products);
    if (products.length === 0) {
      return getSpreadsheetBootstrap();
    }

    return {
      source: "shopify",
      products,
      dimensions: buildDimensions(products),
      shops,
      shopify: {
        enabled: true,
        storeDomain: shopify.storeDomain,
        storefrontTokenPresent: true,
      },
    };
  } catch {
    return getSpreadsheetBootstrap();
  }
}
