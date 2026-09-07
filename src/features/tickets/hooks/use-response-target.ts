"use client";
import { useEffect, useState } from "react";
import { getResponseTarget } from "../utils/response-target";

export function useResponseTarget(ticket: Parameters<typeof getResponseTarget>[0]) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    const refresh = () => setNow(Date.now());
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return getResponseTarget(ticket, now);
}
