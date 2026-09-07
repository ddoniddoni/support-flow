type AuthFailure = {
  field: "email" | "password" | "root.server";
  message: string;
};
export function getAuthFailure(
  error: { code?: string; message?: string; status?: number },
  mode: "login" | "signup",
): AuthFailure {
  const code = error.code;
  const message = error.message?.toLowerCase() ?? "";
  if (
    error.status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  )
    return {
      field: "root.server",
      message: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
    };
  if (code === "email_not_confirmed")
    return {
      field: "root.server",
      message: "이메일 인증이 필요합니다. 가입 확인 메일의 링크를 눌러 주세요.",
    };
  if (mode === "signup") {
    if (
      code === "user_already_exists" ||
      code === "email_exists" ||
      message.includes("already registered")
    )
      return {
        field: "email",
        message: "이미 가입된 이메일입니다. 아래 로그인으로 이동해 주세요.",
      };
    if (
      code === "email_address_invalid" ||
      code === "email_address_not_authorized" ||
      (message.includes("invalid") && message.includes("email"))
    )
      return {
        field: "email",
        message: "가입할 수 없는 이메일입니다. 다른 이메일을 입력해 주세요.",
      };
    if (code === "weak_password" || message.includes("password"))
      return {
        field: "password",
        message:
          "보안 기준을 충족하지 못했습니다. 더 길고 추측하기 어려운 비밀번호를 입력해 주세요.",
      };
  }
  if (
    mode === "login" &&
    (code === "invalid_credentials" ||
      message.includes("invalid login credentials"))
  )
    return {
      field: "root.server",
      message: "이메일 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
    };
  return {
    field: "root.server",
    message:
      "요청을 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.",
  };
}
export function getLoginDestination(next: string | null, role?: string) {
  const fallback =
    role === "customer"
      ? "/tickets/new"
      : role === "agent"
        ? "/tickets"
        : role === "admin"
          ? "/dashboard"
          : "/unauthorized";
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(next)
  )
    return fallback;
  const path = next.split(/[?#]/)[0];
  if (path === "/login" || path === "/signup") return fallback;
  return next;
}
