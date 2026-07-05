import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"], // Specify the weights you need
  variable: "--font-poppins", // Optional: Define a custom CSS variable for the font
});

export const metadata: Metadata = {
  title: "Gombe STATE IRS",
  description:
    "Gombe State Private Tertiary Institutions Electronic Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
        {/* ✅ Toast notification container */}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
