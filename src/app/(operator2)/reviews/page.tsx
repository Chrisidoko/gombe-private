// Operator 2's review queues, one tab each
import ReviewsTabs from "@/components/reviews/ReviewsTabs";
import { REVIEW_TABS, type ReviewTab } from "@/components/reviews/reviewTabs";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab =
    REVIEW_TABS.find((t) => t.id === tab)?.id ?? (null as ReviewTab | null);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Everything Operator 1 has sent for your approval.
          </p>
        </div>
        <ReviewsTabs initialTab={initialTab} />
      </div>
    </div>
  );
}
