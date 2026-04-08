import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Meeting — 회의록 자동 생성",
  description:
    "회의 음성을 실시간 녹음하고 AI로 자동 요약·상세 회의록을 생성하는 스마트 회의 보조 도구",
  keywords: ["회의록", "AI", "자동생성", "STT", "음성인식"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
