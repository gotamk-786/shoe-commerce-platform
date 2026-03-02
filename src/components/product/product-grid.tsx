import { Product } from "@/lib/types";
import ProductCard from "./product-card";
import Skeleton from "../ui/skeleton";

export default function ProductGrid({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-96 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white px-6 py-10 text-center text-gray-600">
        <p className="text-xl font-semibold text-gray-900">New arrivals are on the way</p>
        <p className="mt-2">
          We are curating fresh styles for this collection. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
