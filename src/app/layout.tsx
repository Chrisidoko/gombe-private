import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"], // Specify the weights you need
  variable: "--font-poppins", // Optional: Define a custom CSS variable for the font
});

export const metadata: Metadata = {
  title: "KANO STATE IRS",
  description:
    "Kano State Electronic School Management System for Private institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>{children}</body>
    </html>
  );
}
