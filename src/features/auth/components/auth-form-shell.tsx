import Link from "next/link";
import { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkText: string;
};

export function AuthFormShell({
  title,
  description,
  children,
  footerText,
  footerHref,
  footerLinkText,
}: AuthFormShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/60 p-6">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">SupportFlow</p>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footerText}{" "}
            <Link className="font-medium text-foreground underline" href={footerHref}>
              {footerLinkText}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
