import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Olga Stok - ikas Entegrasyonlu Stok Yönetimi",
  description:
    "Olga Çerçeve Sanayi - AI destekli stok takip, tüketim analizi ve sipariş önerileri",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
