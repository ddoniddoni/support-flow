"use client";

import { useRef, useState } from "react";
import { Loader2, UserRoundPlus } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { SelectionCheckbox } from "@/components/ui/selection-checkbox";
import { useAgents } from "../hooks/use-agents";
import { useBulkAssignTickets } from "../hooks/use-bulk-assign-tickets";
import type { TicketListItem } from "../types";
import { TicketListTable } from "./ticket-list-table";

export function BulkAssignableTickets({ tickets }: { tickets: TicketListItem[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [notice, setNotice] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const agents = useAgents(true);
  const mutation = useBulkAssignTickets();
  const selectedTickets = tickets.filter(ticket => selected.includes(ticket.id));
  const ids = selectedTickets.map(ticket => ticket.id);
  const all = tickets.length > 0 && ids.length === tickets.length;
  const reassignments = selectedTickets.filter(ticket => ticket.assignee_id && ticket.assignee_id !== assigneeId).length;
  const target = agents.data?.find(agent => agent.id === assigneeId);
  function toggleAll() { setSelected(all ? [] : tickets.map(ticket => ticket.id)); setNotice(""); }
  async function assign() {
    if (!target || !ids.length) return;
    try {
      const result = await mutation.mutateAsync({ ticketIds: ids, assigneeId });
      setSelected([]); setOpen(false);
      setNotice(`${target.name}님에게 ${result.changed}건 배정했습니다.${result.unchanged ? ` 이미 같은 담당자인 ${result.unchanged}건은 유지했습니다.` : ""}`);
    } catch { /* Keep selection and display the error for retry. */ }
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SelectionCheckbox label="현재 페이지 선택" checked={all} indeterminate={ids.length > 0 && !all} disabled={mutation.isPending} onChange={toggleAll} />
          <span className="text-sm font-medium">{ids.length}건 선택</span>
          <span className="text-xs text-muted-foreground">현재 페이지 · 필터/페이지 변경 시 선택 해제</span>
        </div>
        <div className="flex gap-2">
          {ids.length ? <Button variant="outline" disabled={mutation.isPending} onClick={() => setSelected([])}>선택 해제</Button> : null}
          <Button ref={triggerRef} disabled={!ids.length || mutation.isPending} onClick={() => { mutation.reset(); setAssigneeId(""); setOpen(true); }}><UserRoundPlus className="size-4" aria-hidden="true" />상담원 배정</Button>
        </div>
      </div>
      {notice ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
      <TicketListTable role="admin" tickets={tickets} selection={{ ids, disabled: mutation.isPending, onToggleAll: toggleAll, onToggle: id => { setNotice(""); setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); } }} />
      <ActionDialog open={open} pending={mutation.isPending} finalFocus={triggerRef} onClose={() => setOpen(false)} title={`선택한 문의 ${ids.length}건을 배정할까요?`} description="기존 담당자가 있는 문의는 선택한 상담원에게 재배정됩니다. 문의 상태와 답변은 유지됩니다." body={
        <div className="grid gap-4">
          <div className="max-h-36 overflow-y-auto rounded-lg bg-muted/40 p-3"><ul className="space-y-2 text-sm">{selectedTickets.map(ticket => <li key={ticket.id} className="break-words">{ticket.title}</li>)}</ul></div>
          {agents.isError ? <div><p role="alert" className="text-sm text-destructive">상담원 목록을 불러오지 못했습니다.</p><Button variant="outline" onClick={() => void agents.refetch()}>다시 시도</Button></div> : <AppSelect aria-label="배정할 상담원" value={assigneeId} onValueChange={setAssigneeId} disabled={agents.isPending || mutation.isPending} options={[{ value: "", label: agents.isPending ? "상담원 불러오는 중…" : "상담원을 선택해 주세요", disabled: true }, ...(agents.data ?? []).map(agent => ({ value: agent.id, label: `${agent.name} · ${agent.email}` }))]} />}
          {agents.isSuccess && !agents.data.length ? <p className="text-sm text-muted-foreground">등록된 상담원이 없습니다. 사용자 관리에서 상담원 권한을 지정해 주세요.</p> : null}
          {target && reassignments > 0 ? <p className="text-sm text-amber-800 dark:text-amber-200">기존 담당자가 있는 {reassignments}건이 {target.name}님에게 이관됩니다.</p> : null}
          {mutation.error ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
        </div>
      }><Button disabled={!target || !ids.length || mutation.isPending} onClick={() => void assign()}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{mutation.isPending ? "배정 중…" : `${ids.length}건 배정하기`}</Button></ActionDialog>
    </div>
  );
}
