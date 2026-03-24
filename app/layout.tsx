import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "去哪吃",
  description: "发现附近美食，找到你的下一餐",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
