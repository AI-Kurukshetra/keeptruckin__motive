import { AlertTriangle } from "lucide-react";

export function NoCompanyNotice() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
        <AlertTriangle className="size-4" />
        No Company Configured
      </div>
      Create or join a company from the dashboard home page before using feature modules.
    </div>
  );
}
