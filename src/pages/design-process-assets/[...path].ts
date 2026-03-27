import fs from "node:fs/promises";
import type { APIRoute } from "astro";
import {
  getDesignProcessAssetBySlug,
  getDesignProcessAssets,
} from "../../lib/design-process";

function getContentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}

export function getStaticPaths() {
  return getDesignProcessAssets().map((asset) => ({
    params: { path: asset.slug },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const asset = getDesignProcessAssetBySlug(params.path ?? "");
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  const data = await fs.readFile(asset.filePath);
  return new Response(data, {
    headers: {
      "Content-Type": getContentType(asset.filePath),
      "Cache-Control": "public, max-age=3600",
    },
  });
};
