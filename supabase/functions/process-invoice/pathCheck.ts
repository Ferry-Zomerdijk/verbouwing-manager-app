export function isOwnInvoicePath(filePath: unknown, userId: string): boolean {
  if (typeof filePath !== "string" || filePath.length > 512) return false;
  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) return false;
  const parts = filePath.split("/");
  return parts.length >= 2 && parts[0] === userId && parts.slice(1).every((p) => p.length > 0);
}
