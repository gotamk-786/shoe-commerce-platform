import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-9 w-9 rounded-full bg-black text-white grid place-items-center text-sm font-bold">
                TS
              </div>
              <span>Thrifty Shoes</span>
            </div>
            <p className="text-sm text-gray-600">
              Footwear reimagined with Apple-level precision. Crafted for movement,
              wrapped in minimalism.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Shop</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              <Link href="/collection">Collection</Link>
              <Link href="/account">Account</Link>
              <Link href="/checkout">Checkout</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Support</h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              <Link href="/account">Orders</Link>
              <Link href="/account">Profile</Link>
              <a href="mailto:support@thriftyshoes.com">support@thriftyshoes.com</a>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Stay updated</p>
            <p className="mt-3 max-w-xs">
              New drops, restocks, and stories about the craft behind every step.
            </p>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-black/10 pt-6 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Thrifty Shoes</span>
          <div className="flex gap-4">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
