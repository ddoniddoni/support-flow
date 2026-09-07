"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReplyTemplates, type ReplyTemplate } from "./hooks";

export function TemplatePicker({
  profileId,
  disabled,
  onUse,
}: {
  profileId: string;
  disabled: boolean;
  onUse: (content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReplyTemplate | null>(null);
  const query = useReplyTemplates(profileId, search, "active", page, open);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={disabled}
        onClick={() => {
          setSelected(null);
          setOpen(true);
        }}
      >
        <BookOpen className="size-4" />
        답변 템플릿
      </Button>
      <ActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title="공용 답변 템플릿"
        description="템플릿을 선택해 내용을 확인하고 작성란에 넣으세요. 고객에게 바로 전송되지 않습니다."
        body={
          <div className="grid max-h-[55vh] gap-3 overflow-y-auto">
            <Input
              aria-label="템플릿 제목 검색"
              placeholder="템플릿 제목 검색"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSelected(null);
              }}
            />
            {query.isLoading ? (
              <p role="status" className="p-4 text-sm text-muted-foreground">
                템플릿을 불러오는 중…
              </p>
            ) : query.isError ? (
              <div role="alert">
                <p>템플릿을 불러오지 못했습니다.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void query.refetch()}
                >
                  다시 시도
                </Button>
              </div>
            ) : !query.data?.items.length ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                사용 가능한 템플릿이 없습니다. 검색어를 바꾸거나 관리자에게
                등록을 요청해 주세요.
              </p>
            ) : (
              query.data.items.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  aria-pressed={selected?.id === template.id}
                  className={`rounded-lg border p-3 text-left ${selected?.id === template.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
                  onClick={() => setSelected(template)}
                >
                  <span className="block text-xs text-muted-foreground">
                    {template.category}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">
                    {template.title}
                  </span>
                </button>
              ))
            )}
            {(query.data?.total ?? 0) > 20 ? (
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => {
                    setPage(page - 1);
                    setSelected(null);
                  }}
                >
                  이전
                </Button>
                <span className="text-sm">
                  {page} / {Math.ceil((query.data?.total ?? 0) / 20)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page * 20 >= (query.data?.total ?? 0)}
                  onClick={() => {
                    setPage(page + 1);
                    setSelected(null);
                  }}
                >
                  다음
                </Button>
              </div>
            ) : null}
            {selected ? (
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  내용 미리보기
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {selected.content}
                </p>
              </div>
            ) : null}
          </div>
        }
      >
        <Button
          type="button"
          disabled={
            !selected ||
            disabled ||
            query.isError ||
            !query.data?.items.some(
              (item) =>
                item.id === selected.id &&
                item.is_active &&
                item.updated_at === selected.updated_at,
            )
          }
          onClick={() => {
            if (selected) {
              onUse(selected.content);
              setOpen(false);
            }
          }}
        >
          작성란에 넣기
        </Button>
      </ActionDialog>
    </>
  );
}
