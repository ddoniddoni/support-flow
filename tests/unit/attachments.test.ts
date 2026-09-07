import assert from "node:assert/strict";
import test from "node:test";
import { detectAttachmentType,attachmentMaxBytes,formatAttachmentSize } from "../../src/features/attachments/validation";
test("attachment type uses file bytes instead of a spoofed filename or MIME",()=>{
 assert.equal(detectAttachmentType(new Uint8Array([137,80,78,71,13,10,26,10])),"image/png");
 assert.equal(detectAttachmentType(new Uint8Array([255,216,255])),"image/jpeg");
 assert.equal(detectAttachmentType(new TextEncoder().encode("%PDF-1.7")),"application/pdf");
 assert.equal(detectAttachmentType(new TextEncoder().encode("RIFF1234WEBP")),"image/webp");
 assert.equal(detectAttachmentType(new TextEncoder().encode("<svg onload=alert(1)>")),null);
 assert.equal(detectAttachmentType(new TextEncoder().encode("<html>")),null);
 assert.equal(attachmentMaxBytes,3145728);assert.equal(formatAttachmentSize(1024),"1 KB");
});
