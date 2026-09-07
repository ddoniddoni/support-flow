import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/api/auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: Request, {params}: {params:Promise<{id:string}>}) {
  const {id} = await params;
  if (!z.uuid().safeParse(id).success) return new NextResponse(null,{status:404});
  const supabase = await createSupabaseServerClient();
  if (!await getCurrentProfile(supabase)) return new NextResponse(null,{status:401});
  // Session-scoped SELECT checks current assignment, ticket ownership and internal visibility.
  const {data,error} = await supabase.from("ticket_attachments").select("object_path,name,mime_type").eq("id",id).maybeSingle();
  if (error || !data) return new NextResponse(null,{status:404});
  const service = createSupabaseServiceRoleClient();
  const file = await service.storage.from("ticket-attachments").download(data.object_path);
  if (file.error || !file.data) return new NextResponse(null,{status:404});
  const inline = data.mime_type.startsWith("image/") && new URL(request.url).searchParams.get("download") !== "1";
  return new NextResponse(await file.data.arrayBuffer(), {headers:{
    "Content-Type": inline ? data.mime_type : "application/octet-stream",
    "Content-Disposition":`${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(data.name)}`,
    "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; sandbox",
  }});
}

export async function DELETE(_request: Request, {params}: {params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!z.uuid().safeParse(id).success)return new NextResponse(null,{status:400});
  const supabase=await createSupabaseServerClient();
  const profile=await getCurrentProfile(supabase);
  if(!profile)return new NextResponse(null,{status:401});
  const service=createSupabaseServiceRoleClient();
  // Claim the staged row atomically before deleting the object; a concurrent send wins or loses as a unit.
  const {data,error}=await service.from("ticket_attachments").delete().eq("id",id).eq("owner_id",profile.id).is("ticket_id",null).select("object_path").maybeSingle();
  if(error)return new NextResponse(null,{status:500});
  if(data)await service.storage.from("ticket-attachments").remove([data.object_path]);
  return new NextResponse(null,{status:204});
}
