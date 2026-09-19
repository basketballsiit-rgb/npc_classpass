import type { Metadata } from "next";
import { Sarabun, Inter } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NPC ClassPass - ระบบตรวจสอบสิทธิ์สอบและแจ้งเตือนการหมดสิทธิ์สอบ (ขร.)",
  description:
    "ระบบตรวจสอบสิทธิ์สอบและแจ้งเตือนการหมดสิทธิ์สอบ ขร. วิทยาลัยสารพัดช่าง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-white text-[#091322] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
