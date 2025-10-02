import type { Metadata } from "next";
import "./globals.css";
import { SiteLogo } from "@/components/site-logo";
import { TopNavigator } from "@/components/top-navigator";

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
            <div className="site-header-top">
              <SiteLogo />
            </div>
            <div className="site-header-nav">
              <div className="site-header-nav-inner">
                <TopNavigator />
              </div>
            </div>
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
