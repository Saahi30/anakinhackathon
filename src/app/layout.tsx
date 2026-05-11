import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StockStrike — competitor stock monitoring",
  description:
    "Detect when competitors go out of stock and capture their homeless traffic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
