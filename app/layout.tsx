import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streaming Demo",
  description: "Demo of partial string streaming with zod-stream",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
