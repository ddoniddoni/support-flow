import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "이메일을 입력해 주세요.")
  .pipe(z.email("올바른 이메일 형식으로 입력해 주세요."));
// Never trim passwords: spaces can be part of an existing credential.
export const passwordSchema = z.string().min(1, "비밀번호를 입력해 주세요.");
export const signupPasswordHint = "8자 이상으로 입력해 주세요.";
export const signupPasswordSchema = passwordSchema.pipe(
  z.string().min(8, "비밀번호는 8자 이상 입력해 주세요."),
);
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const signupSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상 입력해 주세요."),
  email: emailSchema,
  password: signupPasswordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
