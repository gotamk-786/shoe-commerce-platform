import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/store-provider";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-base",
});

export const metadata: Metadata = {
  title: "Thrifty Shoes | Apple-level Luxury Footwear",
  description:
    "Thrifty Shoes pairs premium footwear with a minimalist Apple-inspired experience.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Thrifty Shoes",
    description: "Apple-quality storefront for the modern sneaker enthusiast.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
