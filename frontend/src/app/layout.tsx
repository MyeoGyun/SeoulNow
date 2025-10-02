import type { Metadata } from "next";
import "./globals.css";
import { SiteLogo } from "@/components/site-logo";

export const metadata: Metadata = {
  title: "Seoul Now",
  description: "서울 문화 행사와 날씨 정보를 한눈에 확인하세요",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <SiteLogo />
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
