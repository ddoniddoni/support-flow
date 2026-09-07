import assert from "node:assert/strict";
import test from "node:test";
import {
  createAttachmentName,
  nextAttachmentSequence,
} from "../../src/features/attachments/file-name";
import {
  detectAttachmentType,
  attachmentMaxBytes,
  formatAttachmentSize,
} from "../../src/features/attachments/validation";
test("attachment type uses file bytes instead of a spoofed filename or MIME", () => {
  assert.equal(
    detectAttachmentType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(
    detectAttachmentType(new Uint8Array([255, 216, 255])),
    "image/jpeg",
  );
  assert.equal(
    detectAttachmentType(new TextEncoder().encode("%PDF-1.7")),
    "application/pdf",
  );
  assert.equal(
    detectAttachmentType(new TextEncoder().encode("RIFF1234WEBP")),
    "image/webp",
  );
  assert.equal(
    detectAttachmentType(new TextEncoder().encode("<svg onload=alert(1)>")),
    null,
  );
  assert.equal(detectAttachmentType(new TextEncoder().encode("<html>")), null);
  assert.equal(attachmentMaxBytes, 3145728);
  assert.equal(formatAttachmentSize(1024), "1 KB");
});

test("attachment names preserve valid extensions and use verified MIME for misleading ones", () => {
  assert.equal(
    createAttachmentName(1, "image/png", "개인정보 스크린샷.PNG"),
    "SupportFlow - 01.png",
  );
  assert.equal(
    createAttachmentName(2, "image/jpeg", "photo.jpeg"),
    "SupportFlow - 02.jpeg",
  );
  assert.equal(
    createAttachmentName(3, "application/pdf", "document.exe"),
    "SupportFlow - 03.pdf",
  );
  assert.equal(
    createAttachmentName(4, "image/webp", "photo"),
    "SupportFlow - 04.webp",
  );
  assert.equal(
    createAttachmentName(12, "image/jpeg", "photo.png"),
    "SupportFlow - 12.jpg",
  );
  for (const sequence of [0, -1, 1.5, NaN, 10001]) {
    assert.throws(() =>
      createAttachmentName(sequence, "image/png", "photo.png"),
    );
  }
  assert.throws(() => createAttachmentName(1, "text/html", "page.html"));
});

test("attachment numbering continues across additions and restored drafts without renaming existing files", () => {
  assert.equal(nextAttachmentSequence([]), 1);
  assert.equal(nextAttachmentSequence([{ sequence: 1 }, { sequence: 2 }]), 3);
  assert.equal(nextAttachmentSequence([{ sequence: 2 }]), 3);
  assert.equal(
    nextAttachmentSequence(JSON.parse('[{"sequence":1},{"sequence":4}]')),
    5,
  );
  assert.equal(nextAttachmentSequence([{}, {}]), 3);
});
