const IMAGE_BASE_URL = "https://erp.vpgconstruction.co.in/api/";

/** Resolve backend image paths while preserving absolute URLs and local previews. */
export function getImageUrl(filePath?: any): string {
  if (!filePath) return "";
  if (typeof filePath === "object") {
    filePath = filePath.url || filePath.path || filePath.uri || filePath.secure_url || "";
  }
  if (typeof filePath !== "string" || !filePath.trim()) return "";
  const cleaned = filePath.trim();
  if (/^(https?:|data:|blob:|\/\/)/i.test(cleaned)) return cleaned;

  const relativePath = cleaned.replace(/^\/+/, "").replace(/^api\//, "");
  return IMAGE_BASE_URL + relativePath;
}
