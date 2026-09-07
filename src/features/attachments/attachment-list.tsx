"use client";
import Image from "next/image";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { formatAttachmentSize, type Attachment } from "./validation";

function AttachmentImage({file,large=false}:{file:Attachment;large?:boolean}) {
  const [failed,setFailed]=useState(false);
  if(failed)return <p className="p-4 text-sm text-muted-foreground">이미지를 불러오지 못했습니다. 다운로드를 다시 시도해 주세요.</p>;
  return <Image unoptimized src={`/api/attachments/${file.id}`} alt={file.name} width={large?800:320} height={large?600:144} onError={()=>setFailed(true)} className={large?"max-h-[60vh] w-full object-contain":"h-32 w-full object-contain"}/>;
}

export function AttachmentList({attachments}:{attachments:Attachment[]}) {
  const [preview,setPreview]=useState<Attachment|null>(null);
  if(!attachments.length)return null;
  return <div className="mt-4 grid gap-2">
    <p className="text-xs font-medium text-muted-foreground">첨부파일 {attachments.length}개</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map(file=><div key={file.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-background/60">
        {file.mime_type.startsWith("image/")?<button type="button" className="block w-full bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring" aria-label={`${file.name} 미리보기`} onClick={()=>setPreview(file)}><AttachmentImage file={file}/></button>:null}
        <div className="flex items-center gap-2 p-3"><FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatAttachmentSize(file.size)}</p></div><a href={`/api/attachments/${file.id}?download=1`} aria-label={`${file.name} 다운로드`} className="rounded-md p-2 text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><Download className="size-4"/></a></div>
      </div>)}
    </div>
    <ActionDialog open={!!preview} onClose={()=>setPreview(null)} title={preview?.name??"이미지 미리보기"} description="문의에 첨부된 이미지입니다." body={preview?<AttachmentImage key={preview.id} file={preview} large/>:undefined}>
      <Button type="button" onClick={()=>setPreview(null)}>닫기</Button>
    </ActionDialog>
  </div>;
}
