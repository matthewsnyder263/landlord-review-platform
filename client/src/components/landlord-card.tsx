import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from "./star-rating";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Plus } from "lucide-react";
import type { Landlord, Review } from "@shared/schema";
import { useState } from "react";

interface LandlordCardProps {
  landlord: Landlord;
  onContributeName?: (landlordId: number, address: string) => void;
}

export default function LandlordCard({ landlord, onContributeName }: LandlordCardProps) {
  const { data: reviews } = useQuery<Review[]>({
    queryKey: [`/api/landlords/${landlord.id}/reviews`],
  });

  const latestReview = reviews?.[0];

  const ratingCategories = [
    { name: "Deposit Return", rating: landlord.depositReturnRating || 0 },
    { name: "Responsiveness", rating: landlord.responsivenessRating || 0 },
    { name: "Ethics", rating: landlord.ethicsRating || 0 },
  ];

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link href={`/landlord/${landlord.id}`}>
              <h4 className="text-xl font-semibold text-text-primary hover:text-primary cursor-pointer transition-colors">
                {landlord.name}
                {landlord.name === "Unknown Property Owner" && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Property Data Only
                  </span>
                )}
              </h4>
            </Link>
            <p className="text-text-secondary">{landlord.location}</p>
            <div className="flex items-center mt-2">
              <StarRating rating={landlord.averageRating || 0} readonly />
              <span className="ml-2 text-sm text-text-secondary">
                {landlord.averageRating?.toFixed(1) || "0.0"} ({landlord.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/landlord/${landlord.id}`}>
              <Button variant="ghost" className="text-primary hover:text-blue-700">
                View All Reviews
              </Button>
            </Link>
            {landlord.name === "Unknown Property Owner" && onContributeName && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onContributeName(landlord.id, landlord.address || "")}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Know the landlord?
              </Button>
            )}
          </div>
        </div>

        {/* Rating Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {ratingCategories.map((category) => (
            <div key={category.name} className="text-center">
              <div className="text-sm text-text-secondary mb-1">
                {category.name}
              </div>
              <StarRating rating={category.rating} readonly size="sm" />
              <div className="text-xs text-text-secondary">
                {category.rating.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Latest Review */}
        {latestReview && (
          <div className="border-t pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-text-primary">
                      {latestReview.isAnonymous ? "Anonymous Tenant" : latestReview.authorName}
                    </span>
                    <span className="text-text-secondary text-sm ml-2">
                      {latestReview.createdAt ? formatDistanceToNow(new Date(latestReview.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                  <StarRating rating={latestReview.overallRating} readonly size="sm" />
                </div>
                <p className="text-text-primary text-sm mb-2 line-clamp-3">
                  {latestReview.content}
                </p>
                <div className="flex items-center space-x-4 text-text-secondary text-sm">
                  <button className="hover:text-primary flex items-center space-x-1 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({latestReview.helpfulVotes || 0})</span>
                  </button>
                  <button className="hover:text-primary flex items-center space-x-1 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    <span>Not Helpful ({latestReview.notHelpfulVotes || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
