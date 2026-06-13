import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const metrics = [
  {
    label: "Open tickets",
    value: "42",
    detail: "12 urgent or high priority",
    icon: Ticket,
  },
  {
    label: "In progress",
    value: "18",
    detail: "Across 6 active agents",
    icon: Clock3,
  },
  {
    label: "Resolved today",
    value: "27",
    detail: "Median first response 22m",
    icon: CheckCircle2,
  },
  {
    label: "Internal notes",
    value: "84",
    detail: "Operational context captured",
    icon: MessageSquareText,
  },
];

const tickets = [
  {
    id: "SUP-1048",
    title: "Billing export fails for Q2 invoices",
    customer: "Northstar Labs",
    status: "in_progress",
    priority: "urgent",
    assignee: "Mina Park",
  },
  {
    id: "SUP-1047",
    title: "SSO users intermittently redirected",
    customer: "AtlasCloud",
    status: "open",
    priority: "high",
    assignee: "Unassigned",
  },
  {
    id: "SUP-1046",
    title: "Need audit log for workspace role changes",
    customer: "BrightOps",
    status: "resolved",
    priority: "medium",
    assignee: "Daniel Kim",
  },
];

function priorityTone(priority: string) {
  if (priority === "urgent") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "high") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-6 lg:px-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-zinc-950 text-white">
                <Activity className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">SupportFlow</p>
                <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
                  Support operations dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonVariants({ variant: "outline" })} href="/login">
                Login
              </Link>
              <Link className={buttonVariants()} href="/dashboard">
                Open dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="rounded-lg">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">
                      {metric.value}
                    </CardTitle>
                  </div>
                  <metric.icon className="size-5 text-zinc-500" aria-hidden="true" />
                </CardHeader>
                <CardContent className="text-sm text-zinc-500">
                  {metric.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Priority queue</CardTitle>
            <CardDescription>
              Table-first ticket workflow with role-aware actions planned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-950">
                        {ticket.id}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {ticket.title}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={priorityTone(ticket.priority)}
                        variant="outline"
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assignee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-emerald-600"
                  aria-hidden="true"
                />
                Role model
              </CardTitle>
              <CardDescription>
                Customer, agent, and admin paths are scaffolded for protected
                routing.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Customer</span>
                <Badge variant="secondary">Own tickets</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Agent</span>
                <Badge variant="secondary">Assigned queue</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Admin</span>
                <Badge variant="secondary">All operations</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
                Next implementation step
              </CardTitle>
              <CardAction>
                <Badge variant="outline">Phase 2</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              Connect Supabase auth, define database tables, and replace sample
              dashboard data with TanStack Query hooks.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
