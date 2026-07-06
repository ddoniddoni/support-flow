import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TicketTableSkeleton() {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="mt-2 h-3 w-7/12" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="hidden rounded-lg border border-border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>문의</TableHead>
              <TableHead>답변 상태</TableHead>
              <TableHead>우선순위</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>태그</TableHead>
              <TableHead>AI</TableHead>
              <TableHead>업데이트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 7 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
