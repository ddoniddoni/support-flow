const extensions: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

export function createAttachmentName(
  sequence: number,
  mime: string,
  sourceName: string,
) {
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 10000) {
    throw new Error("잘못된 첨부파일 번호입니다.");
  }
  const allowed = extensions[mime];
  if (!allowed) throw new Error("지원하지 않는 첨부파일 형식입니다.");
  const originalExtension = sourceName.split(".").pop()?.toLowerCase();
  const extension =
    originalExtension && allowed.includes(originalExtension)
      ? originalExtension
      : allowed[0];
  return `SupportFlow - ${String(sequence).padStart(2, "0")}.${extension}`;
}

// Keep existing names stable when adding/removing files or restoring a draft.
export function nextAttachmentSequence(items: { sequence?: number }[]) {
  return Math.max(items.length, ...items.map((item) => item.sequence ?? 0)) + 1;
}
