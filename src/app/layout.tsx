import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LPS Pekanbaru - Sistem Manajemen Armada & Pendataan Sampah",
  description: "Sistem Manajemen Armada dan Pendataan Sampah Kota Pekanbaru",
  icons: {
    icon: [
      { url: "/mylps-icon.png?v=3", type: "image/png", sizes: "128x128" },
      { url: "/favicon.ico?v=3", sizes: "any" },
    ],
    shortcut: "/mylps-icon.png?v=3",
    apple: "/mylps-icon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
