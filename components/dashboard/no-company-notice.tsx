import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NoCompanyNotice() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
        <AlertTriangle className="size-4" />
        No Company Configured
      </div>
      <p>Create or join a company from the dashboard home page before using feature modules.</p>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>Go to Dashboard Setup</Link>
    </div>
  );
}
