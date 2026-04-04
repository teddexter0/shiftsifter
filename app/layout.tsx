import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShiftSifter — MTRH Emergency Department",
  description: "Upload the monthly ED rota and instantly view shifts by day, type, or staff member.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
