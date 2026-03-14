import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to access your fleet dashboard.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getMessageText(message: string | null): string | null {
  if (message === "account_created") {
    return "Account created. Please log in.";
  }

  if (message === "signed_out") {
    return "Signed out successfully.";
  }

  return null;
}

function getErrorText(error: string | null): string | null {
  if (error === "invalid_login_input") {
    return "Please provide a valid email and password.";
  }

  if (error === "invalid_credentials") {
    return "Invalid email or password.";
  }

  if (error === "auth_callback_failed") {
    return "Email confirmation failed. Please try again.";
  }

  if (error === "auth_unavailable") {
    return "Authentication service is temporarily unavailable. Please try again.";
  }

  if (error === "session_unavailable") {
    return "Your session could not be verified. Please sign in again.";
  }

  if (error === "session_terminate_failed") {
    return "Sign-out did not complete cleanly. Please try again.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = getParamValue(resolvedSearchParams?.message);
  const error = getParamValue(resolvedSearchParams?.error);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Access your fleet operations workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={loginAction} className="space-y-4" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required data-testid="login-email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required data-testid="login-password" />
          </div>

          {message ? (
            <p className="text-sm text-emerald-600">{getMessageText(message)}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{getErrorText(error)}</p> : null}

          <Button type="submit" className="w-full" data-testid="login-submit">
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

