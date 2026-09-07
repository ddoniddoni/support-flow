import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function TicketDetailSkeleton({
  isCustomer = false,
}: {
  isCustomer?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:px-8",
        isCustomer ? "max-w-[960px] sm:py-10" : "max-w-[1360px]",
      )}
    >
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div
        className={cn(
          "grid gap-6",
          !isCustomer && "xl:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <Card className="rounded-lg">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
