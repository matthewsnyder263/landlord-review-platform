import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  interactive?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  interactive = false,
  size = "md"
}: StarRatingProps) {
  const isInteractive = interactive && !readonly && onRatingChange;

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const handleStarClick = (index: number) => {
    if (isInteractive) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < Math.floor(rating);
        const isHalfFilled = index === Math.floor(rating) && rating % 1 !== 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            disabled={!isInteractive}
            className={cn(
              "relative transition-all duration-200",
              isInteractive && "hover:scale-125 cursor-pointer transform hover:rotate-12",
              !isInteractive && "cursor-default"
            )}
          >
            <Star 
              className={cn(
                "absolute inset-0 transition-colors duration-200",
                isFilled || isHalfFilled ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-gray-300 hover:text-amber-200"
              )}
            />
            {isHalfFilled && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star
                  className={cn(
                    sizeClasses[size],
                    "fill-yellow-400 text-yellow-400"
                  )}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}