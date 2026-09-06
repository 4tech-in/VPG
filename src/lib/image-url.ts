const IMAGE_BASE_URL = "https://erp.vpgconstruction.co.in/api/";

/** Resolve backend image paths while preserving absolute URLs and local previews. */
export function getImageUrl(filePath?: string | null): string {
  if (!filePath) return "";
  if (/^(https?:|data:|blob:|\/\/)/i.test(filePath)) return filePath;

  const relativePath = filePath.replace(/^\/+/, "").replace(/^api\//, "");
  return IMAGE_BASE_URL + relativePath;
}
