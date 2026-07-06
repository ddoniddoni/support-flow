import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AIReviewTableSkeleton() {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="mt-2 h-3 w-7/12" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-9 w-full" />
          </div>
        ))}
      </div>

      <div className="hidden rounded-lg border border-border bg-card shadow-sm md:block">
        <Table className="min-w-[1040px] table-fixed">
          <colgroup>
            <col className="w-[280px]" />
            <col className="w-[176px]" />
            <col className="w-auto" />
            <col className="w-[132px]" />
            <col className="w-[112px]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>티켓</TableHead>
              <TableHead>AI 상태</TableHead>
              <TableHead>상세 요약</TableHead>
              <TableHead className="text-right">생성일</TableHead>
              <TableHead className="text-right">상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="mt-2 h-3 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="mt-2 h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
