import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://psylattice.com"),

  title: {
    default: "PsyLattice",
    template: "%s | PsyLattice",
  },

  applicationName: "PsyLattice",

  description:
    "PsyLattice is a platform for psychological assessment, monitoring, research and connected care.",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
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