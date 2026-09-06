"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, useReadNotifications } from "./hooks";
const labels:Record<string,string>={assigned:"새 문의가 배정되었습니다",customer_message:"고객이 추가 메시지를 보냈습니다",staff_reply:"지원팀 답변이 도착했습니다"};
export function NotificationBell({profileId,compact=false}:{profileId:string;compact?:boolean}) {
 const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);
 const query=useNotifications(profileId);const read=useReadNotifications();
 const items=query.data?.items??[];const unread=query.data?.unread??0;
 return <>
  <Button ref={trigger} size={compact?"icon":"default"} variant="outline" onClick={()=>setOpen(true)} aria-label={query.isError?"알림 확인 실패 — 다시 확인":`알림${unread?` · 읽지 않음 ${unread}개`:""}`} className="relative gap-2"><Bell className="size-4" aria-hidden="true"/>{!compact?<span>알림</span>:null}{unread>0?<span className={cn("rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground",compact&&"absolute -top-2 -right-2")}>{unread>99?"99+":unread}</span>:null}{query.isError?<span aria-hidden="true">!</span>:null}</Button>
  <ActionDialog open={open} onClose={()=>setOpen(false)} finalFocus={trigger} title="내 알림" description="최근 알림 50개 · 15초마다 갱신합니다. 문의를 열면 확인한 메시지가 읽음 처리됩니다." body={
   <div className="grid gap-3">
    {query.isPending?<p role="status">알림을 불러오는 중…</p>:query.isError?<div role="alert"><p>알림을 불러오지 못했습니다.</p><Button variant="outline" onClick={()=>void query.refetch()}>다시 시도</Button></div>:items.length===0?<p className="py-8 text-center text-sm text-muted-foreground">새 배정이나 메시지가 도착하면 여기에 표시됩니다.</p>:<ul className="max-h-[50dvh] space-y-2 overflow-y-auto">{items.map(item=><li key={item.id}><Link onClick={()=>setOpen(false)} href={`/tickets/${item.ticket_id}`} className={cn("block rounded-lg border p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",item.read_at?"border-border bg-muted/20":"border-primary/30 bg-primary/5")}><p className="flex items-center gap-2 text-sm font-semibold">{!item.read_at?<span className="size-2 shrink-0 rounded-full bg-primary" aria-label="읽지 않음"/>:null}{labels[item.kind]??"문의 알림"}</p><p className="mt-1 line-clamp-2 text-sm leading-6">{item.ticket?.title??"문의 보기"}</p><p className="mt-2 text-xs text-muted-foreground">{item.ticket?`SF-${String(item.ticket.ticket_number).padStart(4,"0")} · `:""}{new Date(item.created_at).toLocaleString("ko-KR")}</p></Link></li>)}</ul>}
    {read.isError?<p role="alert" className="text-sm text-destructive">읽음 처리에 실패했습니다. 다시 시도해 주세요.</p>:null}
   </div>
  }><Button disabled={!items.some(item=>!item.read_at)||read.isPending} onClick={()=>read.mutate({ids:items.filter(item=>!item.read_at).map(item=>item.id)})}>{read.isPending?"처리 중…":"표시된 알림 읽음 처리"}</Button></ActionDialog>
 </>;
}
