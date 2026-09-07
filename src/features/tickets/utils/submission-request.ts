type RequestRecord = { fingerprint: string; id: string };
/** Retain the request token across a lost response/reload; never store message content here. */
export function createSubmissionRequest(scope: string) {
  let memory: RequestRecord | null = null;
  const key = `supportflow:submission:v1:${scope}`;
  return {
    async getId(payload: unknown) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (saved && typeof saved === "object" && "fingerprint" in saved && saved.fingerprint === fingerprint && "id" in saved && typeof saved.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.id)) {
          memory = { fingerprint, id: saved.id };
        }
      } catch { /* Storage may be blocked; in-page retries still retain the token. */ }
      if (memory?.fingerprint !== fingerprint) memory = { fingerprint, id: crypto.randomUUID() };
      try { localStorage.setItem(key, JSON.stringify(memory)); } catch { /* In-memory retry remains available. */ }
      return memory.id;
    },
    clear(id: string) {
      if (memory?.id === id) memory = null;
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null");
        if (saved?.id === id) localStorage.removeItem(key);
      } catch { /* Do not turn a successful submission into a failed one. */ }
    },
  };
}
