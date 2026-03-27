import fs from "node:fs";
import path from "node:path";

export type DesignDoc = {
  filePath: string;
  relativePath: string;
  slug: string;
  url: string;
  title: string;
  section: string;
  depth: number;
};

export type DesignAsset = {
  filePath: string;
  relativePath: string;
  slug: string;
  url: string;
};

export type DesignNavSection = {
  id: string;
  label: string;
  url: string;
  docs: DesignDoc[];
};

const repoRoot = process.cwd();
const designProcessRoot = path.join(repoRoot, "design-process");

function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

function encodeSegments(value: string) {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function walkDirectory(currentPath: string, files: string[] = []) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, files);
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function cleanLabel(value: string) {
  return value
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(markdown: string, fallback: string) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : cleanLabel(fallback);
}

function getDocUrl(relativePath: string) {
  const withoutExtension = toPosixPath(relativePath).replace(/\.md$/i, "");
  return `/design-process/${encodeSegments(withoutExtension)}`;
}

function getAssetUrl(relativePath: string) {
  return `/design-process-assets/${encodeSegments(toPosixPath(relativePath))}`;
}

function getSectionLabel(segment: string) {
  return cleanLabel(segment);
}

function getSectionUrl(section: string) {
  return `/design-process/${encodeSegments(section)}`;
}

let cachedDocs: DesignDoc[] | null = null;
let cachedAssets: DesignAsset[] | null = null;
let cachedDocsByNormalizedPath: Map<string, DesignDoc> | null = null;
let cachedAssetsByNormalizedPath: Map<string, DesignAsset> | null = null;
let cachedAssetsByNormalizedStem: Map<string, DesignAsset> | null = null;

function normalizePathForLookup(value: string) {
  return toPosixPath(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripExtension(value: string) {
  return value.replace(/\.[^.]+$/i, "");
}

export function getDesignProcessDocs() {
  if (cachedDocs) {
    return cachedDocs;
  }

  const docs = walkDirectory(designProcessRoot)
    .filter((filePath) => filePath.toLowerCase().endsWith(".md"))
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(designProcessRoot, filePath));
      const markdown = fs.readFileSync(filePath, "utf8");
      const slug = relativePath.replace(/\.md$/i, "");
      const segments = slug.split("/");

      return {
        filePath,
        relativePath,
        slug,
        url: getDocUrl(relativePath),
        title: extractTitle(markdown, path.basename(relativePath)),
        section: segments[0] ?? "design-process",
        depth: Math.max(0, segments.length - 2),
      } satisfies DesignDoc;
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  cachedDocs = docs;
  cachedDocsByNormalizedPath = new Map(
    docs.map((doc) => [normalizePathForLookup(doc.relativePath), doc]),
  );
  return docs;
}

export function getDesignProcessDocBySlug(slug: string) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  return getDesignProcessDocs().find((doc) => doc.slug === normalizedSlug);
}

export function getDesignProcessAssets() {
  if (cachedAssets) {
    return cachedAssets;
  }

  const assets = walkDirectory(designProcessRoot)
    .filter((filePath) => !filePath.toLowerCase().endsWith(".md"))
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(designProcessRoot, filePath));
      return {
        filePath,
        relativePath,
        slug: relativePath,
        url: getAssetUrl(relativePath),
      } satisfies DesignAsset;
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  cachedAssets = assets;
  cachedAssetsByNormalizedPath = new Map(
    assets.map((asset) => [normalizePathForLookup(asset.relativePath), asset]),
  );
  cachedAssetsByNormalizedStem = new Map(
    assets.map((asset) => [normalizePathForLookup(stripExtension(asset.relativePath)), asset]),
  );
  return assets;
}

export function getDesignProcessAssetBySlug(slug: string) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  return getDesignProcessAssets().find((asset) => asset.slug === normalizedSlug);
}

export function getDesignProcessNavSections() {
  const grouped = new Map<string, DesignDoc[]>();
  for (const doc of getDesignProcessDocs()) {
    const docs = grouped.get(doc.section) ?? [];
    docs.push(doc);
    grouped.set(doc.section, docs);
  }

  return Array.from(grouped.entries()).map(([section, docs]) => ({
    id: section,
    label: getSectionLabel(section),
    url: getSectionUrl(section),
    docs,
  })) satisfies DesignNavSection[];
}

export function getDesignProcessNavSection(sectionId: string) {
  return getDesignProcessNavSections().find((section) => section.id === sectionId);
}

export function rewriteDesignProcessMarkdown(markdown: string, currentRelativePath: string) {
  const currentAbsolutePath = path.join(designProcessRoot, currentRelativePath);
  const currentDirectory = path.dirname(currentAbsolutePath);

  return markdown.replace(/(!?\[[^\]]*])\(([^)]+)\)/g, (match, label, rawTarget) => {
    const target = rawTarget.trim();
    if (
      target.startsWith("#") ||
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("tel:")
    ) {
      return match;
    }

    const [targetPath, hash = ""] = target.split("#");
    const resolvedPath = path.resolve(currentDirectory, targetPath);
    if (!resolvedPath.startsWith(designProcessRoot)) {
      return match;
    }

    const relativeTargetPath = toPosixPath(path.relative(designProcessRoot, resolvedPath));
    const normalizedHash = hash.trim().replace(/\s+/g, "-").toLowerCase();
    const hashSuffix = normalizedHash ? `#${normalizedHash}` : "";

    const doc =
      getDesignProcessDocs().find((item) => item.relativePath === relativeTargetPath) ??
      cachedDocsByNormalizedPath?.get(normalizePathForLookup(relativeTargetPath));
    if (doc) {
      return `${label}(${doc.url}${hashSuffix})`;
    }

    const asset =
      getDesignProcessAssets().find((item) => item.relativePath === relativeTargetPath) ??
      cachedAssetsByNormalizedPath?.get(normalizePathForLookup(relativeTargetPath)) ??
      cachedAssetsByNormalizedStem?.get(normalizePathForLookup(stripExtension(relativeTargetPath)));
    if (asset) {
      return `${label}(${asset.url}${hashSuffix})`;
    }

    if (relativeTargetPath.toLowerCase().endsWith(".md")) {
      return `${label}(${getDocUrl(relativeTargetPath)}${hashSuffix})`;
    }

    return `${label}(${getAssetUrl(relativeTargetPath)}${hashSuffix})`;
  });
}

export function getDesignProcessRoot() {
  return designProcessRoot;
}
