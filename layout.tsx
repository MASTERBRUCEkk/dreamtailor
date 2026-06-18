import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DreamTailor — A new bedtime story, every night",
  description: "Personalized AI bedtime stories, emailed to parents every evening.",
  openGraph: {
    title: "DreamTailor — A new bedtime story, every night",
    description: "Personalized AI bedtime stories, emailed to parents every evening.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "DreamTailor — A new bedtime story, every night",
    description: "Personalized AI bedtime stories, emailed to parents every evening.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
