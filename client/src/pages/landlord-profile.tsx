import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StarRating from "@/components/star-rating";
import ReviewModal from "@/components/review-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { MapPin, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ShareReviewButton from "@/components/share-review-button";
import type { Landlord, Review } from "@shared/schema";

export default function LandlordProfile() {
  const { id } = useParams();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: landlord, isLoading: landlordLoading } = useQuery<Landlord>({
    queryKey: [`/api/landlords/${id}`],
    enabled: !!id,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/landlords/${id}/reviews`],
    enabled: !!id,
  });

  if (landlordLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <Header onWriteReview={() => setIsReviewModalOpen(true)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!landlord) {
    return (
      <div className="min-h-screen bg-surface">
        <Header onWriteReview={() => setIsReviewModalOpen(true)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Landlord Not Found
              </h2>
              <p className="text-text-secondary">
                The landlord you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ratingCategories = [
    { name: "Deposit Return", rating: landlord.depositReturnRating || 0 },
    { name: "Responsiveness", rating: landlord.responsivenessRating || 0 },
    { name: "Ethics", rating: landlord.ethicsRating || 0 },
    { name: "Maintenance", rating: landlord.maintenanceRating || 0 },
    { name: "Communication", rating: landlord.communicationRating || 0 },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header onWriteReview={() => setIsReviewModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Landlord Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {landlord.name}
                </h1>
                <div className="flex items-center text-text-secondary mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  {landlord.location}
                </div>
                {landlord.address && (
                  <p className="text-text-secondary">{landlord.address}</p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center mb-2">
                  <StarRating rating={landlord.averageRating || 0} readonly />
                  <span className="ml-2 text-lg font-semibold text-text-primary">
                    {landlord.averageRating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <p className="text-text-secondary">
                  {landlord.totalReviews || 0} reviews
                </p>
              </div>
            </div>

            {/* Rating Categories */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {ratingCategories.map((category) => (
                <div key={category.name} className="text-center">
                  <div className="text-sm text-text-secondary mb-1">
                    {category.name}
                  </div>
                  <StarRating rating={category.rating} readonly size="sm" />
                  <div className="text-xs text-text-secondary mt-1">
                    {category.rating.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full md:w-auto"
            >
              Write a Review
            </Button>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Reviews ({landlord.totalReviews || 0})
          </h2>
        </div>

        {reviewsLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-text-primary">
                          {review.isAnonymous ? "Anonymous Tenant" : review.authorName}
                        </span>
                        {review.isAnonymous && (
                          <Badge variant="secondary" className="ml-2">
                            Anonymous
                          </Badge>
                        )}
                        <span className="text-text-secondary text-sm ml-4">
                          {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ""}
                        </span>
                      </div>
                    </div>
                    <StarRating rating={review.overallRating} readonly />
                  </div>

                  <p className="text-text-primary mb-4">{review.content}</p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-xs">
                    <div className="text-center">
                      <div className="text-text-secondary">Deposit</div>
                      <StarRating rating={review.depositReturnRating} readonly size="xs" />
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary">Response</div>
                      <StarRating rating={review.responsivenessRating} readonly size="xs" />
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary">Ethics</div>
                      <StarRating rating={review.ethicsRating} readonly size="xs" />
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary">Maintenance</div>
                      <StarRating rating={review.maintenanceRating} readonly size="xs" />
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary">Communication</div>
                      <StarRating rating={review.communicationRating} readonly size="xs" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-text-secondary text-sm">
                      <button className="hover:text-primary flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.helpfulVotes || 0})</span>
                      </button>
                      <button className="hover:text-primary flex items-center space-x-1">
                        <ThumbsDown className="w-4 h-4" />
                        <span>Not Helpful ({review.notHelpfulVotes || 0})</span>
                      </button>
                    </div>
                    {landlord && (
                      <ShareReviewButton 
                        review={review} 
                        landlord={landlord}
                        className="ml-auto"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-secondary text-lg mb-4">
                No reviews yet for this landlord.
              </p>
              <Button onClick={() => setIsReviewModalOpen(true)}>
                Be the first to review
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        landlordId={landlord.id}
        landlordName={landlord.name}
      />

      <Footer />
    </div>
  );
}
