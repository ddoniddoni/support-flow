export function messageOf(error: unknown) {
  return error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : "저장하지 못했습니다. 다시 시도해 주세요.";
}
