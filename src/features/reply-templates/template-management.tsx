"use client";
import { useState } from "react";
import { messageOf } from "@/lib/error-message";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, BookOpen, Search } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/ui/app-select";
import { replyTemplateSchema, type ReplyTemplateInput } from "./schema";
import {
  useReplyTemplates,
  useSaveReplyTemplate,
  type ReplyTemplate,
} from "./hooks";

const templateDate = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

function TemplateEditor({
  id,
  template,
  onClose,
  onSaved,
}: {
  id: string;
  template?: ReplyTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSaveReplyTemplate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReplyTemplateInput>({
    resolver: zodResolver(replyTemplateSchema),
    defaultValues: {
      title: template?.title ?? "",
      category: template?.category ?? "일반",
      content: template?.content ?? "",
      isActive: template?.is_active ?? true,
    },
  });
  return (
    <ActionDialog
      open
      onClose={onClose}
      pending={mutation.isPending}
      title={template ? "템플릿 편집" : "새 답변 템플릿"}
      description="공용 템플릿을 작성하세요. 비활성화하면 상담원의 선택 목록에서 숨겨집니다."
      body={
        <form
          id="template-editor"
          className="grid gap-3"
          onSubmit={handleSubmit((input) =>
            mutation.mutate(
              { ...input, id, updatedAt: template?.updated_at },
              { onSuccess: onSaved },
            ),
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="template-title">템플릿 제목</Label>
            <Input
              id="template-title"
              maxLength={80}
              disabled={mutation.isPending}
              {...register("title")}
            />
            {errors.title ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-category">분류</Label>
            <Input
              id="template-category"
              maxLength={40}
              placeholder="예: 계정, 결제, 추가 확인"
              disabled={mutation.isPending}
              {...register("category")}
            />
            {errors.category ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.category.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-content">답변 내용</Label>
            <Textarea
              id="template-content"
              className="min-h-48 text-base leading-7"
              maxLength={4000}
              disabled={mutation.isPending}
              {...register("content")}
            />
            {errors.content ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.content.message}
              </p>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-blue-500"
              disabled={mutation.isPending}
              {...register("isActive")}
            />
            상담원에게 사용 가능하도록 표시
          </label>
          {mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {messageOf(mutation.error)}
            </p>
          ) : null}
        </form>
      }
    >
      <Button
        type="submit"
        form="template-editor"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "저장 중…" : "템플릿 저장"}
      </Button>
    </ActionDialog>
  );
}

export function TemplateManagement({ profileId }: { profileId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const search = params.get("search") ?? "";
  const status = ["all", "active", "inactive"].includes(
    params.get("status") ?? "",
  )
    ? params.get("status")!
    : "all";
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
  );
  const query = useReplyTemplates(profileId, search, status, page);
  const [editor, setEditor] = useState<{
    id: string;
    template?: ReplyTemplate;
  } | null>(null);
  const [notice, setNotice] = useState("");
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    router.push(`/admin/templates?${next}`);
  }
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">팀 공용 자료</p>
          <h1 className="text-2xl font-semibold">답변 템플릿</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            자주 쓰는 안내를 관리합니다. 상담원이 선택한 후 상황에 맞게 수정해
            전송합니다.
          </p>
        </div>
        <Button
          onClick={() => {
            setNotice("");
            setEditor({ id: crypto.randomUUID() });
          }}
        >
          <Plus className="size-4" />새 템플릿
        </Button>
      </header>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_180px]">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({
              search: String(
                new FormData(event.currentTarget).get("search") ?? "",
              ),
              page: "1",
            });
          }}
        >
          <Input
            key={search}
            aria-label="템플릿 제목 검색"
            name="search"
            defaultValue={search}
            placeholder="템플릿 제목으로 검색"
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" />
            검색
          </Button>
        </form>
        <AppSelect
          aria-label="템플릿 상태"
          value={status}
          onValueChange={(value) => navigate({ status: value, page: "1" })}
          options={[
            { value: "all", label: "전체 상태" },
            { value: "active", label: "사용 중" },
            { value: "inactive", label: "비활성" },
          ]}
        />
      </div>
      {notice ? (
        <p
          role="status"
          className="text-sm text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </p>
      ) : null}
      {query.isLoading ? (
        <div
          role="status"
          className="h-48 animate-pulse rounded-xl bg-muted"
          aria-label="템플릿 불러오는 중"
        />
      ) : query.isError ? (
        <div role="alert" className="rounded-xl border p-5">
          <p>템플릿을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : !query.data?.items.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">표시할 템플릿이 없습니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            검색 조건을 바꾸거나 새 템플릿을 등록해 주세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {query.data.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{item.category}</Badge>
                <Badge variant={item.is_active ? "secondary" : "outline"}>
                  {item.is_active ? "사용 중" : "비활성"}
                </Badge>
              </div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {item.content}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  최근 수정 {templateDate.format(new Date(item.updated_at))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotice("");
                    setEditor({ id: item.id, template: item });
                  }}
                >
                  편집
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {query.data ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            총 {query.data.total}개
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 20 >= query.data.total}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              다음
            </Button>
          </div>
        </div>
      ) : null}
      {editor ? (
        <TemplateEditor
          key={editor.id}
          {...editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("템플릿을 저장했습니다.");
          }}
        />
      ) : null}
    </div>
  );
}
