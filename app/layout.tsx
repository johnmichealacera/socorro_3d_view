import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socorro 3D Interactive Map",
  description:
    "3D interactive island viewer for Socorro, Surigao del Norte, Philippines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
