import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import StarRating from "./star-rating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertReviewSchema, insertLandlordSchema } from "@shared/schema";

const reviewFormSchema = z.object({
  landlordName: z.string().min(1, "Landlord name is required"),
  propertyAddress: z.string().optional(),
  overallRating: z.number().min(1, "Overall rating is required").max(5),
  depositReturnRating: z.number().min(1, "Deposit return rating is required").max(5),
  responsivenessRating: z.number().min(1, "Responsiveness rating is required").max(5),
  ethicsRating: z.number().min(1, "Ethics rating is required").max(5),
  maintenanceRating: z.number().min(1, "Maintenance rating is required").max(5),
  communicationRating: z.number().min(1, "Communication rating is required").max(5),
  content: z.string().min(10, "Review must be at least 10 characters long"),
  isAnonymous: z.boolean().default(false),
  authorName: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordId?: number;
  landlordName?: string;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  landlordId, 
  landlordName 
}: ReviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      landlordName: landlordName || "",
      propertyAddress: "",
      overallRating: 0,
      depositReturnRating: 0,
      responsivenessRating: 0,
      ethicsRating: 0,
      maintenanceRating: 0,
      communicationRating: 0,
      content: "",
      isAnonymous: false,
      authorName: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      let currentLandlordId = landlordId;

      // If no landlordId provided, create or find landlord
      if (!currentLandlordId) {
        try {
          // Try to create landlord (will fail if exists)
          const landlordData = {
            name: data.landlordName,
            location: "Location not specified",
            address: data.propertyAddress,
          };
          
          const response = await apiRequest("POST", "/api/landlords", landlordData);
          const newLandlord = await response.json();
          currentLandlordId = newLandlord.id;
        } catch (error) {
          // If creation fails, search for existing landlord
          const searchResponse = await fetch(`/api/landlords?search=${encodeURIComponent(data.landlordName)}`);
          const landlords = await searchResponse.json();
          
          if (landlords.length > 0) {
            currentLandlordId = landlords[0].id;
          } else {
            throw new Error("Could not create or find landlord");
          }
        }
      }

      // Create review
      const reviewData = {
        landlordId: currentLandlordId,
        authorName: data.isAnonymous ? null : (data.authorName || "Anonymous"),
        isAnonymous: data.isAnonymous,
        overallRating: data.overallRating,
        depositReturnRating: data.depositReturnRating,
        responsivenessRating: data.responsivenessRating,
        ethicsRating: data.ethicsRating,
        maintenanceRating: data.maintenanceRating,
        communicationRating: data.communicationRating,
        content: data.content,
      };

      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted successfully!",
        description: "Thank you for sharing your experience.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/landlords"] });
      if (landlordId) {
        queryClient.invalidateQueries({ queryKey: [`/api/landlords/${landlordId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/landlords/${landlordId}/reviews`] });
      }
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    createReviewMutation.mutate(data);
  };

  const ratingCategories = [
    { key: "depositReturnRating" as const, label: "Deposit Return" },
    { key: "responsivenessRating" as const, label: "Request Responsiveness" },
    { key: "ethicsRating" as const, label: "Ethical Practices" },
    { key: "maintenanceRating" as const, label: "Maintenance Quality" },
    { key: "communicationRating" as const, label: "Communication" },
    { key: "overallRating" as const, label: "Overall Experience" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Landlord Info */}
            <FormField
              control={form.control}
              name="landlordName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landlord or Property Management Company *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter landlord name or company" 
                      {...field}
                      disabled={!!landlordName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating Categories */}
            <div>
              <h4 className="text-md font-medium text-text-primary mb-4">
                Rate Your Experience
              </h4>
              
              <div className="space-y-4">
                {ratingCategories.map((category) => (
                  <FormField
                    key={category.key}
                    control={form.control}
                    name={category.key}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className={category.key === 'overallRating' ? 'font-medium' : ''}>
                            {category.label}
                          </FormLabel>
                          <FormControl>
                            <StarRating
                              rating={field.value}
                              onRatingChange={field.onChange}
                              interactive
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Written Review */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Share your experience with this landlord or property manager..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-text-secondary">
                    Please be honest and constructive. Reviews are subject to our community guidelines.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Anonymous Option */}
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm">
                    Submit this review anonymously
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Author Name (if not anonymous) */}
            {!form.watch("isAnonymous") && (
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createReviewMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
