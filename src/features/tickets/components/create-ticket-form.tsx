"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useCreateTicket } from "../hooks/use-create-ticket";
import {
  createTicketSchema,
  ticketCategories,
  type CreateTicketInput,
} from "../schemas/ticket-schema";

const categoryLabels: Record<CreateTicketInput["category"], string> = {
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  other: "기타",
};

function getCreateTicketErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("row-level security")) {
    return "문의를 등록할 권한이 없습니다. Supabase RLS 정책을 확인해 주세요.";
  }

  if (normalizedMessage.includes("login") || normalizedMessage.includes("auth")) {
    return "로그인 후 다시 시도해 주세요.";
  }

  return "문의를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function CreateTicketForm() {
  const router = useRouter();
  const createTicketMutation = useCreateTicket();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "technical",
    },
  });

  async function onSubmit(input: CreateTicketInput) {
    setFormError(null);

    try {
      const ticket = await createTicketMutation.mutateAsync(input);
      router.replace(`/tickets?created=${ticket.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setFormError(getCreateTicketErrorMessage(message));
    }
  }

  const isPending = createTicketMutation.isPending;
  const selectClassName = cn(
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm",
    "outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  );

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          placeholder="예: 결제 영수증을 다시 받을 수 있나요?"
          aria-invalid={Boolean(errors.title)}
          disabled={isPending}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          className={selectClassName}
          aria-invalid={Boolean(errors.category)}
          disabled={isPending}
          {...register("category")}
        >
          {ticketCategories.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        {errors.category ? (
          <p className="text-sm text-red-600">{errors.category.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">문의 내용</Label>
        <Textarea
          id="content"
          className="min-h-40 resize-y"
          placeholder="문의가 필요한 상황, 기대한 결과, 실제 결과를 함께 적어 주세요. 지원팀이 접수 후 확인합니다."
          aria-invalid={Boolean(errors.content)}
          disabled={isPending}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-red-600">{errors.content.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-2 sm:flex sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          취소
        </Button>
        <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          문의 등록
        </Button>
      </div>
    </form>
  );
}
