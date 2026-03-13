import { redirect } from "next/navigation";

export default function HomePage() {
  // TODO: implement auth-aware redirect with server session check
  const isAuthenticated = false;

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return <div className="p-8">{"// TODO: implement landing page"}</div>;
}
