"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleCart } from "@/store/slices/ui-slice";
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { fetchWishlist } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const compareCount = useAppSelector((state) => state.compare.items.length);
  const user = useAppSelector((state) => state.user.profile);
  const token = useAppSelector((state) => state.user.token);
  const forceAdmin = process.env.NEXT_PUBLIC_FORCE_ADMIN === "true";
  const isAdmin = (user && user.role === "admin") || forceAdmin;
  const [wishlistCount, setWishlistCount] = useState(0);
  const wishlistDisplay = token ? wishlistCount : 0;
  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    if (!token) return;
    fetchWishlist()
      .then((items) => setWishlistCount(items.length))
      .catch(() => setWishlistCount(0));
  }, [token]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/collection", label: "Collection" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/account", label: "Account" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="glass fade-border flex flex-col gap-3 rounded-2xl px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-bold text-white">
                TS
              </div>
              <span>Thrifty Shoes</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-1 ${
                    pathname === link.href ? "text-black" : "text-gray-600"
                  }`}
                >
                  {pathname === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 h-[2px] w-full bg-black"
                    />
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:gap-3">
            <Link href="/wishlist">
              <Button variant="ghost" className="text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-black/5">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                    </svg>
                  </span>
                  <span className="hidden sm:inline">Wishlist</span>
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                    {wishlistDisplay}
                  </span>
                </span>
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="ghost" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Compare</span>
                <span className="sm:ml-1">{compareCount}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => dispatch(toggleCart(true))}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">
                Cart • {cartItems.length} | {formatCurrency(total)}
              </span>
              <span className="sm:hidden">Cart {cartItems.length}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
