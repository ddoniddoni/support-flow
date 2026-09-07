"use client";
import { useId, useRef } from "react";
import { Paperclip, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachmentAccept, formatAttachmentSize } from "./validation";
import type { AttachmentSelection } from "./use-attachments";

export function AttachmentPicker({selection,disabled=false,internal=false}:{selection:AttachmentSelection;disabled?:boolean;internal?:boolean}) {
  const id=useId();
  const inputRef=useRef<HTMLInputElement>(null);
  return <section aria-label={internal?"내부 메모 첨부파일":"첨부파일"} className="grid gap-3 rounded-lg border border-dashed border-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium"><Paperclip className="size-4" aria-hidden="true"/>{internal?"내부 전용 첨부":"파일 첨부"} <span className="text-muted-foreground">{selection.items.length}/5</span></label>
      <Button type="button" variant="outline" size="sm" disabled={disabled || selection.items.length>=5} onClick={()=>inputRef.current?.click()}><Paperclip className="size-4"/>파일 선택</Button>
      <input ref={inputRef} id={id} type="file" multiple accept={attachmentAccept} disabled={disabled || selection.items.length>=5} className="sr-only" onChange={event=>{void selection.queue.add(Array.from(event.target.files??[]));event.target.value="";}}/>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">JPG·PNG·WebP·PDF · 파일당 3MB, 최대 5개. {internal?"고객에게 공개되지 않습니다.":"문의와 함께 상대방에게 전달됩니다."}</p>
    {selection.items.map(item=><div key={item.id} className="flex min-w-0 items-center gap-3 rounded-md bg-muted/40 p-3">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{formatAttachmentSize(item.size)} · {item.status==="ready"?"첨부 준비 완료":item.status==="uploading"?"업로드 중…":item.error}</p></div>
      {item.status==="uploading"?<Loader2 className="size-4 shrink-0 animate-spin" aria-label="업로드 중"/>:item.status==="error"?<Button type="button" variant="outline" size="sm" disabled={disabled} onClick={()=>selection.queue.retry(item.id)}>재시도</Button>:null}
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.name} 제거`} disabled={disabled || item.status==="uploading"} onClick={()=>selection.queue.remove(item.id)}><X className="size-4"/></Button>
    </div>)}
    {selection.error?<p role="alert" className="text-sm text-destructive">{selection.error}</p>:null}
  </section>;
}
