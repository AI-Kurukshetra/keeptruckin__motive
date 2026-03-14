import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your fleet workspace account.",
};

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getErrorText(error: string | null): string | null {
  if (error === "invalid_register_input") {
    return "Enter a valid email and matching password fields.";
  }

  return error;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = getParamValue(resolvedSearchParams?.error);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create an account to start managing your fleet.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={registerAction} className="space-y-4" data-testid="register-form">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required data-testid="register-email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required data-testid="register-password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required data-testid="register-confirm-password" />
          </div>

          {error ? <p className="text-sm text-destructive">{getErrorText(error)}</p> : null}

          <Button type="submit" className="w-full" data-testid="register-submit">
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}


