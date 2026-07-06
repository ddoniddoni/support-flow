import { WhitepaceLanding } from "@/features/landing/components/whitepace-landing";

export default async function Home() {
  return (
    <WhitepaceLanding
      workspaceHref="/login"
      workspaceLabel="Demo 열기"
    />
  );
}
