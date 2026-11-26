import type { Metadata } from "next";
import type { ReactNode } from "react";
import icon from "../assets/images/bida.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIDA in Hong Kong",
  icons: { icon: { url: icon.src, type: "image/png" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
