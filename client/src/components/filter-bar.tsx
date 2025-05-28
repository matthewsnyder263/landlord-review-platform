import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  location: string;
  onLocationChange: (location: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  filterRating?: number;
  onFilterRatingChange: (rating?: number) => void;
}

export default function FilterBar({
  location,
  onLocationChange,
  sortBy,
  onSortByChange,
  filterRating,
  onFilterRatingChange,
}: FilterBarProps) {
  const locations = [
    "All Locations",
    "San Francisco, CA",
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Seattle, WA",
    "Frederick, MD",
    "Baltimore, MD",
  ];

  const ratings = [
    { value: undefined, label: "All Ratings" },
    { value: 5, label: "5 Stars" },
    { value: 4, label: "4+ Stars" },
    { value: 3, label: "3+ Stars" },
    { value: 2, label: "2+ Stars" },
    { value: 1, label: "1+ Stars" },
  ];

  const sortOptions = [
    { value: "most-recent", label: "Most Recent" },
    { value: "highest-rated", label: "Highest Rated" },
    { value: "lowest-rated", label: "Lowest Rated" },
    { value: "most-reviews", label: "Most Reviews" },
  ];

  return (
    <section className="bg-gray-50 py-6 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-text-primary">Filter by:</span>
            
            <Select 
              value={location || "All Locations"} 
              onValueChange={(value) => onLocationChange(value === "All Locations" ? "" : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filterRating?.toString() || "all"} 
              onValueChange={(value) => onFilterRatingChange(value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                {ratings.map((rating) => (
                  <SelectItem 
                    key={rating.value || "all"} 
                    value={rating.value?.toString() || "all"}
                  >
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">Sort by:</span>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
