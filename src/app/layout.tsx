import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Query Builder",
  description: "Schema-driven recursive query builder built with Next.js"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
