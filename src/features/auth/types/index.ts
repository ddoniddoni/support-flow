import type { Role } from "@/types/domain";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};
