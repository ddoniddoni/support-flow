export const attachmentMaxBytes = 3 * 1024 * 1024;
export const attachmentMaxCount = 5;
export const attachmentAccept = "image/jpeg,image/png,image/webp,application/pdf";
export type Attachment = { id: string; name: string; mime_type: string; size: number; reply_id: string | null; is_internal: boolean };
export function detectAttachmentType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)) return "image/png";
  const ascii = (start:number,end:number) => String.fromCharCode(...bytes.slice(start,end));
  if (ascii(0,4)==="RIFF" && ascii(8,12)==="WEBP") return "image/webp";
  if (ascii(0,5)==="%PDF-") return "application/pdf";
  return null;
}
export function formatAttachmentSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1,Math.ceil(bytes/1024))} KB`;
}
