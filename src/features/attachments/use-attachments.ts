"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { attachmentAccept, attachmentMaxBytes, attachmentMaxCount, type Attachment } from "./validation";

type Item = Pick<Attachment,"id"|"name"|"size"|"mime_type"> & {status:"uploading"|"ready"|"error";error?:string;file?:File};
type Snapshot = {items:Item[];error:string|null};
const empty:Snapshot = {items:[],error:null};
function createQueue(scope:string,ticketId?:string,internal=false) {
  let snapshot=empty;
  const listeners=new Set<()=>void>();
  const key=`supportflow:attachments:v1:${scope}`;
  function publish(next:Snapshot) {
    snapshot=next;
    try {sessionStorage.setItem(key,JSON.stringify(next.items.filter(item=>item.status==="ready").map(({id,name,size,mime_type,status})=>({id,name,size,mime_type,status}))));} catch { /* Existing uploads remain usable in this page. */ }
    listeners.forEach(listener=>listener());
  }
  async function upload(item:Item) {
    if(!item.file)return;
    publish({...snapshot,items:snapshot.items.map(current=>current.id===item.id?{...current,status:"uploading",error:undefined}:current)});
    try {
      const form=new FormData();form.set("id",item.id);form.set("file",item.file);form.set("internal",String(internal));if(ticketId)form.set("ticketId",ticketId);
      const response=await fetch("/api/attachments",{method:"POST",body:form});
      const body=await response.json();
      if(!response.ok)throw new Error(body.message??"업로드에 실패했습니다.");
      publish({...snapshot,items:snapshot.items.map(current=>current.id===item.id?{...current,...body.attachment,status:"ready"}:current)});
    } catch(error) {
      publish({...snapshot,items:snapshot.items.map(current=>current.id===item.id?{...current,status:"error",error:error instanceof Error?error.message:"다시 시도해 주세요."}:current)});
    }
  }
  return {
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    getSnapshot:()=>snapshot,
    restore:()=>{
      try {
        const items:unknown=JSON.parse(sessionStorage.getItem(key)??"[]");
        if(Array.isArray(items))publish({items:items.filter((item):item is Item=>item && typeof item.id==="string" && typeof item.name==="string" && typeof item.size==="number" && item.status==="ready" && attachmentAccept.split(",").includes(item.mime_type)).slice(0,attachmentMaxCount),error:null});
      }catch{/* Ignore corrupt saved selections. */}
    },
    async add(files:File[]) {
      if(snapshot.items.length+files.length>attachmentMaxCount){publish({...snapshot,error:"첨부파일은 최대 5개까지 선택할 수 있습니다."});return;}
      if(files.some(file=>!file.size || file.size>attachmentMaxBytes || !attachmentAccept.split(",").includes(file.type))){publish({...snapshot,error:"JPG·PNG·WebP·PDF 파일을 3MB 이하로 선택해 주세요."});return;}
      const items:Item[]=files.map(file=>({id:crypto.randomUUID(),name:file.name,size:file.size,mime_type:file.type,status:"uploading",file}));
      publish({items:[...snapshot.items,...items],error:null});
      for(const item of items)await upload(item);
    },
    retry:(id:string)=>{const item=snapshot.items.find(item=>item.id===id);if(item)void upload(item);},
    remove:(id:string)=>{publish({items:snapshot.items.filter(item=>item.id!==id),error:null});void fetch(`/api/attachments/${id}`,{method:"DELETE"}).catch(()=>{});},
    getIds:()=>{if(snapshot.items.some(item=>item.status!=="ready"))throw new Error("첨부파일 업로드를 완료하거나 실패한 파일을 제거해 주세요.");return snapshot.items.map(item=>item.id);},
    clear:()=>publish(empty),
  };
}
export function useAttachments({scope,ticketId,internal=false}:{scope:string;ticketId?:string;internal?:boolean}) {
  const [queue]=useState(()=>createQueue(scope,ticketId,internal));
  const snapshot=useSyncExternalStore(queue.subscribe,queue.getSnapshot,()=>empty);
  useEffect(()=>queue.restore(),[queue]);
  return {...snapshot,queue,blocked:snapshot.items.some(item=>item.status!=="ready")};
}
export type AttachmentSelection = ReturnType<typeof useAttachments>;
