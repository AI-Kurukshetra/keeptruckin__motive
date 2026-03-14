import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Atlas Fleet Intelligence",
  description: "AI-powered fleet intelligence platform for modern logistics teams.",
};

export default function HomePage() {
  return <LandingPage />;
}
