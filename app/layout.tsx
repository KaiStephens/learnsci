import type { Metadata } from "next";
import "tldraw/tldraw.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnSci",
  description: "Realtime computer science exam review workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
