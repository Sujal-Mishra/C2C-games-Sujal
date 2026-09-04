import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/poppins/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logo Stack | Code2Create",
  description: "A cherry-blossom physics stacking game."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
