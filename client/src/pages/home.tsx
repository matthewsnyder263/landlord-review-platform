import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SearchBar from "@/components/search-bar";
import FilterBar from "@/components/filter-bar";
import LandlordCard from "@/components/landlord-card";
import ReviewModal from "@/components/review-modal";
import ContributeLandlordModal from "@/components/contribute-landlord-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import type { Landlord } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("most-recent");
  const [filterRating, setFilterRating] = useState<number | undefined>();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributeData, setContributeData] = useState<{ landlordId: number; address: string } | null>(null);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (location) params.set("location", location);
    if (sortBy !== "most-recent") params.set("sortBy", sortBy);
    if (filterRating) params.set("filterRating", filterRating.toString());
    return params.toString();
  };

  const { data: landlords, isLoading } = useQuery<Landlord[]>({
    queryKey: ["/api/landlords", buildQueryParams()],
    queryFn: async () => {
      const params = buildQueryParams();
      
      // Use enhanced search when we have both search query and location
      if (searchQuery && location) {
        const enhancedUrl = `/api/enhanced-search?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`;
        const response = await fetch(enhancedUrl);
        if (!response.ok) throw new Error("Failed to fetch enhanced search results");
        return response.json();
      }
      
      // Otherwise use regular search
      const url = params ? `/api/landlords?${params}` : "/api/landlords";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch landlords");
      return response.json();
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const popularLocations = [
    "San Francisco, CA",
    "New York, NY", 
    "Los Angeles, CA"
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header onWriteReview={() => setIsReviewModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Find and Review Your Landlord
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Help other tenants make informed decisions by sharing your rental experience
          </p>
          
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search landlords or addresses..."
          />

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {popularLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className="bg-gray-100 px-4 py-2 rounded-full text-sm text-text-secondary hover:bg-gray-200 transition-colors"
              >
                <MapPin className="inline-block w-4 h-4 mr-2" />
                Popular: {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar
        location={location}
        onLocationChange={setLocation}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        filterRating={filterRating}
        onFilterRatingChange={setFilterRating}
      />

      {/* Results Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-text-primary mb-2">
            Recent Reviews
          </h3>
          <p className="text-text-secondary">
            {landlords ? `Showing ${landlords.length} landlords and property managers` : "Loading..."}
          </p>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          ) : landlords && landlords.length > 0 ? (
            landlords.map((landlord) => (
              <LandlordCard key={landlord.id} landlord={landlord} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg">
                No landlords found matching your criteria.
              </p>
              <Button 
                onClick={() => setIsReviewModalOpen(true)}
                className="mt-4"
              >
                Be the first to add a review
              </Button>
            </div>
          )}
        </div>
      </main>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
