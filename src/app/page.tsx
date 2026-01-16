import MarketingShowcase from "@/components/sections/marketing-showcase";
import FeaturedProducts from "@/components/sections/featured-products";
import CategoryStories from "@/components/sections/category-stories";

export default function Home() {
  return (
    <div className="space-y-14 pb-24">
      <MarketingShowcase />
      <FeaturedProducts />
      <CategoryStories />
      <section className="mx-auto max-w-6xl px-6">
        <div className="glass fade-border relative overflow-hidden rounded-3xl px-6 py-10 md:px-10">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="pill mb-2 inline-block text-gray-700">Promise</p>
              <h3 className="text-2xl font-semibold text-gray-900">Engineered for movement</h3>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                Smooth interactions, live data, no clutter. Thrifty Shoes stays premium from landing to checkout.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <span className="pill">Smooth cart drawer</span>
              <span className="pill">API-first content</span>
              <span className="pill">Responsive grid</span>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.08),_transparent_60%)] blur-3xl" />
        </div>
      </section>
    </div>
  );
}
