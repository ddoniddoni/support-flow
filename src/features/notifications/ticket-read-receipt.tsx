"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useReadNotifications } from "./hooks";
export function TicketReadReceipt({ticketId,replyOrder}:{ticketId:string;replyOrder:number}) {
 const {mutate,isError,isPending}=useReadNotifications();
 useEffect(()=>{mutate({ticketId,replyOrder});},[mutate,ticketId,replyOrder]);
 if(!isError)return null;
 return <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">알림 읽음 처리를 완료하지 못했습니다.<Button variant="outline" disabled={isPending} onClick={()=>mutate({ticketId,replyOrder})}>다시 시도</Button></div>;
}
