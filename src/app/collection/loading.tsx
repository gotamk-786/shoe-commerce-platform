import SectionHeading from "@/components/ui/section-heading";
import Skeleton from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="Collection"
        title="Shop the collection"
        description="Loading styles..."
      />
      <div className="mt-6">
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
