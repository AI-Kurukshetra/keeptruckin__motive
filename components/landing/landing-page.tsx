"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Building2,
  CarFront,
  CheckCircle2,
  Database,
  Gauge,
  Layers,
  Lock,
  Radar,
  RouteIcon,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Platform", href: "#platform" },
  { label: "Security", href: "#security" },
] as const;

const trustedLogos = ["Northstar Freight", "Summit Carriers", "Velocity Haul", "Atlas Movers", "Cobalt Logistics"] as const;

const capabilities = [
  {
    title: "Fleet Visibility",
    description: "Centralized live view of drivers, vehicles, trips, and operational risk.",
    icon: Radar,
  },
  {
    title: "Driver Safety Intelligence",
    description: "Behavior insights and safety scoring to reduce incidents and violations.",
    icon: ShieldCheck,
  },
  {
    title: "Vehicle Monitoring",
    description: "Monitor utilization, status drift, and readiness for every unit in your fleet.",
    icon: CarFront,
  },
  {
    title: "Trip Analytics",
    description: "Track route performance, trip lifecycle, and execution quality at scale.",
    icon: RouteIcon,
  },
  {
    title: "Predictive Maintenance",
    description: "Catch maintenance risk early with proactive service intelligence.",
    icon: Wrench,
  },
  {
    title: "Compliance Monitoring",
    description: "Compliance-first workflows for safer operations and audit readiness.",
    icon: CheckCircle2,
  },
] as const;

const showcases = [
  {
    title: "Driver Safety Intelligence",
    description:
      "Surface risky behavior patterns, prioritize interventions, and improve coaching outcomes with a unified safety timeline.",
    bullets: ["Behavior trend snapshots", "Event severity prioritization", "Driver-level risk scoring"],
    stat: "-28% incident rate",
  },
  {
    title: "Vehicle Operations Monitoring",
    description:
      "Track each vehicle's health and activity with status-aware insights that keep operations predictable and efficient.",
    bullets: ["Live unit readiness", "Service interval alerts", "Usage and uptime trends"],
    stat: "92% fleet availability",
  },
  {
    title: "Trip Performance Analytics",
    description: "Analyze route efficiency and completion outcomes with clear, actionable trip intelligence.",
    bullets: ["Planned vs actual variance", "Delay root-cause summaries", "Utilization benchmarking"],
    stat: "+19% route efficiency",
  },
  {
    title: "Fleet Maintenance Automation",
    description:
      "Automate reminders and maintenance planning with workflows designed for high-volume operational teams.",
    bullets: ["Predictive maintenance queue", "Priority-based scheduling", "Maintenance completion audits"],
    stat: "40% fewer overdue tasks",
  },
] as const;

const aiMetrics = [
  { label: "Fleet Health Score", value: 97, suffix: "/100" },
  { label: "Driver Safety Insights", value: 245, suffix: " weekly signals" },
  { label: "Trip Efficiency", value: 19, suffix: "% uplift" },
] as const;

const platformItems = [
  "Multi-tenant fleet architecture",
  "Role-based access control",
  "Real-time analytics",
  "Compliance-first design",
] as const;

const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Analytics", "Automation", "Integrations"],
  },
  {
    title: "Platform",
    links: ["Architecture", "Performance", "Reliability", "API"],
  },
  {
    title: "Security",
    links: ["Compliance", "Data Protection", "Access Control", "Audit Trail"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "DPA", "Cookies"],
  },
] as const;

function CtaButton({ href, label, variant = "default" }: { href: Route; label: string; variant?: "default" | "outline" }) {
  return (
    <Link href={href}>
      <Button
        variant={variant}
        size="lg"
        className={cn("h-11 rounded-xl px-6", variant === "outline" && "border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white")}
      >
        {label}
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </Link>
  );
}

function Reveal({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedMetric({ label, value, suffix, delay = 0 }: { label: string; value: number; suffix: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
    >
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
        className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
      >
        {value}
        <span className="ml-1 text-base text-slate-300">{suffix}</span>
      </motion.p>
      <p className="mt-2 text-sm text-slate-300">{label}</p>
    </motion.div>
  );
}

function ProductMock({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-2 w-3/4 rounded bg-slate-200" />
        <div className="h-2 w-full rounded bg-slate-100" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
        </div>
        <div className="h-24 rounded-xl bg-gradient-to-r from-sky-100 to-indigo-100" />
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="rounded-lg bg-white/10 p-1.5 text-sky-300">
              <Layers className="size-4" />
            </span>
            Atlas Fleet Intelligence
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-200 hover:bg-white/10 hover:text-white">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl bg-sky-500 text-white hover:bg-sky-400">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.32),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.28),transparent_42%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <Sparkles className="size-3.5 text-sky-300" />
                Logistics Intelligence Platform
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                AI-Powered Fleet Intelligence for Modern Logistics
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                Unify fleet visibility, safety analytics, and compliance operations in one real-time platform built for high-growth logistics teams.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaButton href="/register" label="Get Started" />
                <CtaButton href="/login" label="Login" variant="outline" />
              </div>
            </Reveal>

            <Reveal>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-sky-500/10 backdrop-blur"
              >
                <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <Card className="border-white/10 bg-white/5 text-slate-100">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs">Active Trips</CardTitle>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">124</CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 text-slate-100">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs">Fleet Health</CardTitle>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">97/100</CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 text-slate-100">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs">Open Alerts</CardTitle>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">18</CardContent>
                    </Card>
                  </div>
                  <div className="h-48 rounded-xl bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-cyan-500/20 p-4">
                    <div className="h-full rounded-lg border border-white/10 bg-slate-950/70 p-4">
                      <p className="text-xs text-slate-400">Operational Overview</p>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="h-24 rounded-md bg-sky-400/30" />
                        <div className="h-20 rounded-md bg-sky-400/20" />
                        <div className="h-16 rounded-md bg-sky-400/15" />
                        <div className="h-20 rounded-md bg-sky-400/25" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-white/10 bg-slate-900/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
            <p className="text-center text-sm text-slate-300">Trusted by modern logistics teams</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {trustedLogos.map((logo) => (
                <div key={logo} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-300">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Product Capabilities</h2>
            <p className="mt-3 text-slate-300">Operational depth across fleet intelligence, safety, and compliance.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={capability.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                >
                  <Card className="h-full rounded-2xl border-white/10 bg-white/5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-white">
                        <span className="rounded-lg bg-sky-400/15 p-2 text-sky-300">
                          <Icon className="size-4" />
                        </span>
                        {capability.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-300">{capability.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="product" className="mx-auto w-full max-w-7xl space-y-16 px-4 pb-20 md:px-6">
          {showcases.map((item, index) => {
            const reversed = index % 2 === 1;
            return (
              <div key={item.title} className={cn("grid gap-8 lg:grid-cols-2 lg:items-center", reversed && "lg:[&>*:first-child]:order-2")}>
                <Reveal>
                  <p className="text-sm text-sky-300">Product Showcase {index + 1}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-4 text-slate-300">{item.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-300" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200">{item.stat}</div>
                </Reveal>
                <Reveal>
                  <ProductMock title={item.title} />
                </Reveal>
              </div>
            );
          })}
        </section>

        <section className="border-y border-white/10 bg-slate-900/70 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
            <Reveal className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">AI Intelligence Layer</h2>
              <p className="mt-3 text-slate-300">Actionable insights powered by real-time fleet and operational telemetry.</p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {aiMetrics.map((metric, index) => (
                <AnimatedMetric key={metric.label} label={metric.label} value={metric.value} suffix={metric.suffix} delay={index * 0.08} />
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto w-full max-w-7xl px-4 py-20 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Enterprise Platform</h2>
              <p className="mt-4 text-slate-300">Built for secure scale with multi-tenant architecture and role-aware controls.</p>
              <ul className="mt-8 space-y-3">
                {platformItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="size-4 text-sky-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal id="security" className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Security by Design</h3>
              <p className="mt-3 text-slate-300">Operational security with auditable access, tenant isolation, and compliance-ready workflows.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Card className="rounded-xl border-white/10 bg-slate-900/70">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-slate-200">
                    <Lock className="size-4 text-sky-300" />
                    Granular access policies
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-white/10 bg-slate-900/70">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-slate-200">
                    <Database className="size-4 text-sky-300" />
                    Multi-tenant data isolation
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-white/10 bg-slate-900/70">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-slate-200">
                    <Gauge className="size-4 text-sky-300" />
                    Real-time risk monitoring
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-white/10 bg-slate-900/70">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-slate-200">
                    <Building2 className="size-4 text-sky-300" />
                    Enterprise-ready deployment
                  </CardContent>
                </Card>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-6">
          <Reveal className="rounded-3xl border border-white/10 bg-gradient-to-r from-sky-600/25 via-indigo-600/20 to-cyan-600/25 p-8 text-center shadow-xl md:p-12">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Start Managing Your Fleet Smarter</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">Move from reactive operations to AI-assisted decision making across your entire fleet.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaButton href="/register" label="Get Started" />
              <CtaButton href="/login" label="Login" variant="outline" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:grid-cols-6 md:px-6">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="rounded-lg bg-white/10 p-1.5 text-sky-300">
                <Truck className="size-4" />
              </span>
              Atlas Fleet
            </Link>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-sm font-medium text-white">{column.title}</p>
              <ul className="space-y-2 text-sm text-slate-400">
                {column.links.map((link) => (
                  <li key={link} className="transition-colors hover:text-slate-200">{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
