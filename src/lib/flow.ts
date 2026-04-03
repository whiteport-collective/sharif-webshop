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
  products: FlowProduct[];
  dimensions: FlowDimensions;
  shops: FlowShop[];
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
  };
}

export async function getFlowBootstrapData(): Promise<FlowBootstrap> {
  const products = getCatalogProducts().map(toFlowProduct);
  const dimensions = getDimensionCatalog();

  return { products, dimensions, shops };
}
