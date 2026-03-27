import path from "node:path";
import xlsx from "xlsx";

export type CatalogProduct = {
  id: string;
  itemNo: string;
  brand: string;
  model: string;
  size: string;
  width: string;
  profile: string;
  rim: string;
  loadIndex: string;
  speedRating: string;
  dimensionLabel: string;
  fuelRating: string;
  gripRating: string;
  noiseDb: number;
  noiseClass: string;
  ean: string;
  retailPrice: number;
  stockCount: number;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  storyNo: string;
  storyEn: string;
};

export type DimensionCatalog = {
  widths: string[];
  profilesByWidth: Record<string, string[]>;
  rimsByWidthProfile: Record<string, string[]>;
};

type ParsedSize = {
  width: string;
  profile: string;
  rim: string;
};

const workbookPath = path.join(
  process.cwd(),
  "design-process",
  "A-Product-Brief",
  "reference-data",
  "Powertrac-Summer-Tyre-Price-List.xlsx",
);

let cachedProducts: CatalogProduct[] | null = null;
let cachedDimensions: DimensionCatalog | null = null;

function parsePassengerSize(size: string): ParsedSize | null {
  const trimmed = size.trim().toUpperCase();
  const match = trimmed.match(/^(\d{3})\/(\d{2})(?:ZR|R)(\d{2})$/);
  if (!match) {
    return null;
  }

  return {
    width: match[1],
    profile: match[2],
    rim: match[3],
  };
}

function parseLoadSpeed(value: string) {
  const match = value.trim().toUpperCase().match(/^(\d+(?:\/\d+)?)([A-Z]+)$/);
  if (!match) {
    return {
      loadIndex: value.trim(),
      speedRating: "",
    };
  }

  return {
    loadIndex: match[1],
    speedRating: match[2],
  };
}

function buildRetailPrice(fobValue: number) {
  return Math.max(399, Math.round((fobValue * 28) / 10) * 10 - 1);
}

function buildStock(index: number) {
  const pattern = index % 7;
  if (pattern === 6) {
    return { stockCount: 0, stockStatus: "out-of-stock" as const };
  }
  if (pattern === 0) {
    return { stockCount: 4, stockStatus: "low-stock" as const };
  }
  return { stockCount: 10 + (index % 8), stockStatus: "in-stock" as const };
}

function fuelSentence(locale: "no" | "en", rating: string) {
  if (["A", "B"].includes(rating)) {
    return locale === "no"
      ? "snillere mot forbruket enn de fleste budsjettdekk"
      : "better on fuel than most budget tires";
  }
  if (["C", "D"].includes(rating)) {
    return locale === "no"
      ? "helt normalt på drivstoff"
      : "perfectly normal on fuel";
  }
  return locale === "no"
    ? "mer bygget for pris enn for lavt forbruk"
    : "more tuned for price than low consumption";
}

function gripSentence(locale: "no" | "en", rating: string) {
  if (["A", "B"].includes(rating)) {
    return locale === "no"
      ? "gir trygg følelse når veien er våt"
      : "feels confident when the road is wet";
  }
  if (["C", "D"].includes(rating)) {
    return locale === "no"
      ? "gir godt nok grep til vanlig hverdagskjøring"
      : "has enough grip for everyday driving";
  }
  return locale === "no"
    ? "passer best når du bare vil få jobben gjort billig"
    : "best when the priority is simply getting the job done cheaply";
}

function noiseSentence(locale: "no" | "en", noiseDb: number) {
  if (noiseDb <= 69) {
    return locale === "no" ? "og holder seg ganske stille på motorvei." : "and stays fairly quiet on the motorway.";
  }
  if (noiseDb <= 71) {
    return locale === "no"
      ? "med et støynivå som ikke stjeler oppmerksomheten."
      : "with a noise level that stays out of the way.";
  }
  return locale === "no"
    ? "og du merker litt mer dekklyd, men uten dramatikk."
    : "and you will hear a bit more tire noise, but nothing dramatic.";
}

function buildStory(model: string, fuelRating: string, gripRating: string, noiseDb: number, locale: "no" | "en") {
  if (locale === "no") {
    return `${model} er et rett fram hverdagsdekk som holder prisen nede, ${fuelSentence(
      locale,
      fuelRating,
    )}, ${gripSentence(locale, gripRating)}, ${noiseSentence(locale, noiseDb)}`;
  }

  return `${model} is a straight-talking everyday tire that keeps the price down, ${fuelSentence(
    locale,
    fuelRating,
  )}, ${gripSentence(locale, gripRating)}, ${noiseSentence(locale, noiseDb)}`;
}

export function getCatalogProducts() {
  if (cachedProducts) {
    return cachedProducts;
  }

  const workbook = xlsx.readFile(workbookPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
  });

  const products = rows
    .slice(3)
    .map((row, index) => {
      const itemNo = String(row[0] ?? "").trim();
      const size = String(row[1] ?? "").trim();
      const loadAndSpeed = String(row[2] ?? "").trim();
      const model = String(row[3] ?? "").trim();
      const fuelRating = String(row[4] ?? "").trim().toUpperCase();
      const gripRating = String(row[5] ?? "").trim().toUpperCase();
      const noiseDb = Number(row[6] ?? 0);
      const noiseClass = String(row[7] ?? "").trim().toUpperCase();
      const ean = String(row[9] ?? "").trim();
      const fob = Number(row[13] ?? 0);
      const parsedSize = parsePassengerSize(size);

      if (!itemNo || !parsedSize || !model || !fob) {
        return null;
      }

      const { loadIndex, speedRating } = parseLoadSpeed(loadAndSpeed);
      const { stockCount, stockStatus } = buildStock(index);
      const retailPrice = buildRetailPrice(fob);
      const dimensionLabel = `${parsedSize.width}/${parsedSize.profile}R${parsedSize.rim} ${loadAndSpeed}`;

      return {
        id: itemNo.toLowerCase(),
        itemNo,
        brand: "Powertrac",
        model,
        size,
        width: parsedSize.width,
        profile: parsedSize.profile,
        rim: parsedSize.rim,
        loadIndex,
        speedRating,
        dimensionLabel,
        fuelRating,
        gripRating,
        noiseDb,
        noiseClass,
        ean,
        retailPrice,
        stockCount,
        stockStatus,
        storyNo: buildStory(model, fuelRating, gripRating, noiseDb, "no"),
        storyEn: buildStory(model, fuelRating, gripRating, noiseDb, "en"),
      } satisfies CatalogProduct;
    })
    .filter((product): product is CatalogProduct => Boolean(product))
    .sort((left, right) => left.retailPrice - right.retailPrice);

  cachedProducts = products;
  return products;
}

export function getDimensionCatalog() {
  if (cachedDimensions) {
    return cachedDimensions;
  }

  const profilesByWidth = new Map<string, Set<string>>();
  const rimsByWidthProfile = new Map<string, Set<string>>();

  for (const product of getCatalogProducts()) {
    const profileSet = profilesByWidth.get(product.width) ?? new Set<string>();
    profileSet.add(product.profile);
    profilesByWidth.set(product.width, profileSet);

    const rimKey = `${product.width}/${product.profile}`;
    const rimSet = rimsByWidthProfile.get(rimKey) ?? new Set<string>();
    rimSet.add(product.rim);
    rimsByWidthProfile.set(rimKey, rimSet);
  }

  cachedDimensions = {
    widths: Array.from(profilesByWidth.keys()).sort((left, right) => Number(left) - Number(right)),
    profilesByWidth: Object.fromEntries(
      Array.from(profilesByWidth.entries()).map(([width, profiles]) => [
        width,
        Array.from(profiles).sort((left, right) => Number(left) - Number(right)),
      ]),
    ),
    rimsByWidthProfile: Object.fromEntries(
      Array.from(rimsByWidthProfile.entries()).map(([key, rims]) => [
        key,
        Array.from(rims).sort((left, right) => Number(left) - Number(right)),
      ]),
    ),
  };

  return cachedDimensions;
}

export function getFeaturedProductsByDimension(width: string, profile: string, rim: string) {
  return getCatalogProducts().filter(
    (product) => product.width === width && product.profile === profile && product.rim === rim,
  );
}
