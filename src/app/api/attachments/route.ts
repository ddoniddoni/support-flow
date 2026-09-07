import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/api/auth-api";
import { createAttachmentName } from "@/features/attachments/file-name";
import {
  attachmentMaxBytes,
  detectAttachmentType,
} from "@/features/attachments/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

async function readUpload(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > attachmentMaxBytes + 65536) {
      await reader.cancel();
      throw new Error("SIZE");
    }
    chunks.push(value);
  }
  return new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: Buffer.concat(chunks),
  }).formData();
}
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile)
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    const form = await readUpload(request);
    const id = z.uuid().safeParse(form.get("id"));
    const sequence = z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .safeParse(form.get("sequence") ?? 1);
    if (!sequence.success)
      return NextResponse.json(
        { message: "잘못된 첨부파일 번호입니다." },
        { status: 400 },
      );
    const ticketId = form.get("ticketId") || null;
    const internal = form.get("internal") === "true";
    const file = form.get("file");
    if (
      !id.success ||
      !(file instanceof File) ||
      !file.size ||
      file.size > attachmentMaxBytes
    )
      return NextResponse.json(
        { message: "파일당 3MB 이하의 파일을 선택해 주세요." },
        { status: 400 },
      );
    if (ticketId) {
      if (!z.uuid().safeParse(ticketId).success)
        return NextResponse.json(
          { message: "잘못된 문의입니다." },
          { status: 400 },
        );
      const { data, error } = await supabase
        .from("ticket_workspace")
        .select("id")
        .eq("id", String(ticketId))
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return NextResponse.json(
          { message: "문의 접근 권한이 없습니다." },
          { status: 403 },
        );
    } else if (profile.role !== "customer")
      return NextResponse.json(
        { message: "문의 상세에서 파일을 첨부해 주세요." },
        { status: 403 },
      );
    if (internal && profile.role === "customer")
      return NextResponse.json(
        { message: "내부 메모 첨부 권한이 없습니다." },
        { status: 403 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = detectAttachmentType(bytes);
    if (!mime)
      return NextResponse.json(
        { message: "JPG, PNG, WebP 이미지와 PDF만 첨부할 수 있습니다." },
        { status: 400 },
      );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const service = createSupabaseServiceRoleClient();
    const { data: existing, error: existingError } = await service
      .from("ticket_attachments")
      .select("*")
      .eq("id", id.data)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (
        existing.owner_id !== profile.id ||
        existing.sha256 !== sha256 ||
        existing.upload_ticket_id !== ticketId ||
        existing.is_internal !== internal
      )
        return NextResponse.json(
          { message: "다른 파일의 업로드 번호입니다." },
          { status: 409 },
        );
      return NextResponse.json({
        attachment: {
          id: existing.id,
          name: existing.name,
          mime_type: existing.mime_type,
          size: existing.size,
        },
      });
    }
    // Opportunistically remove this user's abandoned uploads; attached files are never removed here.
    const { data: expired } = await service
      .from("ticket_attachments")
      .delete()
      .eq("owner_id", profile.id)
      .is("ticket_id", null)
      .lt("created_at", new Date(Date.now() - 86400000).toISOString())
      .select("id,object_path");
    if (expired?.length) {
      await service.storage
        .from("ticket-attachments")
        .remove(expired.map((item) => item.object_path));
    }
    const { count, error: countError } = await service
      .from("ticket_attachments")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", profile.id)
      .is("ticket_id", null);
    if (countError) throw countError;
    if ((count ?? 0) >= 20)
      return NextResponse.json(
        {
          message:
            "미등록 첨부가 많습니다. 기존 첨부를 등록하거나 잠시 후 다시 시도해 주세요.",
        },
        { status: 429 },
      );
    const path = `${profile.id}/${id.data}`;
    const { error: uploadError } = await service.storage
      .from("ticket-attachments")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;
    const name = createAttachmentName(sequence.data, mime, file.name);
    const { data, error } = await service
      .from("ticket_attachments")
      .insert({
        id: id.data,
        owner_id: profile.id,
        upload_ticket_id: ticketId ? String(ticketId) : null,
        is_internal: internal,
        name,
        mime_type: mime,
        size: file.size,
        object_path: path,
        sha256,
      })
      .select("id,name,mime_type,size")
      .single();
    if (error) {
      await service.storage.from("ticket-attachments").remove([path]);
      throw error;
    }
    return NextResponse.json({ attachment: data });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message === "SIZE"
            ? "파일당 3MB 이하로 첨부해 주세요."
            : "업로드하지 못했습니다. 파일을 다시 시도해 주세요.",
      },
      { status: 400 },
    );
  }
}
