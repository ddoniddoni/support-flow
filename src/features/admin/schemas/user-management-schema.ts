import { z } from "zod";

export const managedRoleSchema = z.enum(["customer", "agent", "admin"]);
export const managedRoleLabels = { customer: "고객", agent: "상담원", admin: "관리자" } as const;
export const createManagedUserSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(60, "이름은 60자 이하로 입력해 주세요."),
  email: z.email("올바른 이메일을 입력해 주세요.").max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12, "초기 비밀번호는 12자 이상 입력해 주세요.").max(72, "비밀번호는 72자 이하로 입력해 주세요."),
  role: managedRoleSchema,
});
export type CreateManagedUserInput = z.input<typeof createManagedUserSchema>;
export const changeManagedRoleSchema = z.object({ role: managedRoleSchema });
export const userListSchema = z.object({
  q: z.string().trim().max(100).default(""),
  role: z.enum(["all", "customer", "agent", "admin"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
