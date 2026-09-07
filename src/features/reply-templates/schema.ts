import { z } from "zod";
export const replyTemplateSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(80),
  category: z.string().trim().min(1, "분류를 입력해 주세요.").max(40),
  content: z
    .string()
    .trim()
    .min(3, "내용을 3자 이상 입력해 주세요.")
    .max(4000, "최대 4,000자까지 입력할 수 있습니다."),
  isActive: z.boolean(),
});
export type ReplyTemplateInput = z.infer<typeof replyTemplateSchema>;
