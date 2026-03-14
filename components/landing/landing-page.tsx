import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CarFront,
  Gauge,
  GitBranch,
  Layers,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Tech Stack", href: "#stack" },
] as const;

const previewCards = [
  {
    title: "Dashboard Overview",
    text: "Real-time fleet visibility with health score, active trips, and unresolved alerts.",
    icon: Gauge,
  },
  {
    title: "Drivers Management",
    text: "Track driver status, licensing data, and operational assignments in one place.",
    icon: Users,
  },
  {
    title: "Vehicle Tracking",
    text: "Monitor mileage, maintenance load, and unit-level readiness at scale.",
    icon: CarFront,
  },
  {
    title: "Trip Analytics",
    text: "Analyze route performance, utilization, and trip lifecycle outcomes.",
    icon: BarChart3,
  },
  {
    title: "Safety Alerts",
    text: "Prioritize critical events with severity badges and action-ready workflows.",
    icon: AlertTriangle,
  },
] as const;

const features = [
  {
    title: "Fleet Visibility",
    description: "Live operational view across drivers, vehicles, trips, and unresolved issues.",
    icon: MonitorSmartphone,
  },
  {
    title: "Driver Performance",
    description: "Driver-level insights for compliance, utilization, and safety behavior.",
    icon: Users,
  },
  {
    title: "Vehicle Monitoring",
    description: "Surface maintenance readiness, status drift, and utilization hotspots.",
    icon: Truck,
  },
  {
    title: "Trip Analytics",
    description: "From route planning to completion metrics, keep every movement measurable.",
    icon: Activity,
  },
  {
    title: "Safety & Compliance",
    description: "Consolidate incidents, alerts, and checks into a single operational layer.",
    icon: ShieldCheck,
  },
  {
    title: "Fleet Health Score",
    description: "A unified score blending safety, inspections, and maintenance signals.",
    icon: Sparkles,
  },
] as const;

const intelligenceCards = [
  {
    title: "Fleet Health Score",
    description: "Unified health score with weighted safety, maintenance, and inspection inputs.",
    value: "107 / 100",
  },
  {
    title: "Driver Safety Insights",
    description: "Identify frequent behavior risks and route-specific incident concentrations.",
    value: "8 active drivers",
  },
  {
    title: "Maintenance Predictions",
    description: "Proactive maintenance outlook by status distribution and service windows.",
    value: "4 scheduled records",
  },
  {
    title: "Trip Efficiency Analytics",
    description: "Compare trip outcomes and improve route-level planning and execution.",
    value: "10 seeded trips",
  },
] as const;

const workflow = [
  { label: "Drivers", icon: Users },
  { label: "Vehicles", icon: Truck },
  { label: "Trips", icon: GitBranch },
  { label: "Alerts", icon: AlertTriangle },
  { label: "Insights", icon: BrainCircuit },
] as const;

const stack = ["Next.js", "Supabase", "Tailwind", "shadcn/ui", "React Query", "Playwright"] as const;

function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="text-sm text-muted-foreground transition hover:text-foreground">
      {label}
    </a>
  );
}

function CtaLink({ href, label, variant = "default" }: { href: Route; label: string; variant?: "default" | "outline" }) {
  return (
    <Link href={href}>
      <Button variant={variant} size="lg">
        {label}
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(circle_at_top,#3b82f633,transparent_60%)]" />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <div className="rounded-md bg-primary/10 p-1 text-primary">
              <Layers className="size-4" />
            </div>
            Atlas Fleet Intelligence
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavButton key={link.label} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Start Demo</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-20 px-4 pb-20 pt-12 md:px-6 md:pt-16">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/10 via-background to-background p-8 md:p-12">
          <Badge variant="secondary" className="mb-4">Logistics AI Platform</Badge>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            AI-Powered Fleet Intelligence for Modern Logistics
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Turn fleet operations into a measurable growth engine with real-time visibility, predictive maintenance,
            and compliance-first decision support across every trip.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href="/dashboard" label="Start Demo" />
            <CtaLink href="/dashboard" label="View Dashboard" variant="outline" />
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Live Fleet Ops</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">24/7</p></CardContent>
            </Card>
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Data Confidence</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">107/100</p></CardContent>
            </Card>
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Demo Ready</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">Instant</p></CardContent>
            </Card>
          </div>
        </section>

        <section id="product" className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Product Preview</h2>
            <p className="mt-2 text-muted-foreground">Everything operations teams need to run a modern fleet.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {previewCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="group transition hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="size-5 text-primary transition group-hover:scale-110" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{card.text}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="features" className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Key Features</h2>
            <p className="mt-2 text-muted-foreground">Designed for high-velocity fleet and compliance teams.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="transition hover:border-primary/40 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="size-5 text-primary" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{feature.description}</CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">AI Fleet Intelligence</h2>
            <p className="mt-2 text-muted-foreground">Operational analytics modeled for immediate action.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {intelligenceCards.map((card) => (
              <Card key={card.title} className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 to-primary" />
                <CardHeader>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Product Workflow</h2>
            <p className="mt-2 text-muted-foreground">From telemetry to insight in one connected system.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {workflow.map((node, index) => {
              const Icon = node.icon;
              return (
                <div key={node.label} className="flex items-center gap-2">
                  <Card className="w-full">
                    <CardContent className="flex items-center gap-2 p-4">
                      <Icon className="size-4 text-primary" />
                      <span className="text-sm font-medium">{node.label}</span>
                    </CardContent>
                  </Card>
                  {index < workflow.length - 1 ? <ArrowRight className="hidden size-4 text-muted-foreground md:block" /> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section id="stack" className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Technology Stack</h2>
            <p className="mt-2 text-muted-foreground">Production-grade tooling powering the demo platform.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <Badge key={item} variant="outline" className="rounded-full px-3 py-1 text-sm">
                {item}
              </Badge>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-6 md:p-8">
          <h3 className="text-xl font-semibold">Demo Access</h3>
          <p className="mt-2 text-sm text-muted-foreground">Use this account to experience the platform immediately.</p>
          <div className="mt-4 grid gap-2 text-sm">
            <div><span className="font-medium">Email:</span> demo@atlasfleet.com</div>
            <div><span className="font-medium">Password:</span> Demo123!</div>
          </div>
          <div className="mt-6">
            <CtaLink href="/login" label="Open Demo Login" />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>Atlas Fleet Intelligence</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#stack" className="hover:text-foreground">Tech stack</a>
            <a href="https://github.com/AI-Kurukshetra/keeptruckin__motive" target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub
            </a>
          </div>
        </div>
        <Separator />
      </footer>
    </div>
  );
}

