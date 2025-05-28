import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rentCastService } from "./rentcast-service";
import { insertLandlordSchema, insertReviewSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all landlords with optional filtering and sorting
  app.get("/api/landlords", async (req, res) => {
    try {
      const { sortBy, filterRating, search, location } = req.query;
      
      let landlords = [];
      
      // If searching, first try RentCast API for real data
      if (search || location) {
        try {
          const rentCastLandlords = await rentCastService.searchProperties(
            search as string || "", 
            location as string | undefined
          );
          
          // Save RentCast landlords to database so they can be accessed later
          for (const landlord of rentCastLandlords) {
            try {
              // Check if landlord already exists
              const existing = await storage.getLandlordByName(landlord.name);
              if (!existing) {
                await storage.createLandlord({
                  name: landlord.name,
                  location: landlord.location,
                  address: landlord.address
                });
              }
            } catch (error) {
              // Continue if landlord already exists
            }
          }
          
          landlords = rentCastLandlords;
        } catch (error) {
          console.log("RentCast API unavailable, falling back to local data");
        }
        
        // Also include local landlords that match the search
        const localLandlords = await storage.searchLandlords(
          search as string || "", 
          location as string | undefined
        );
        
        // Merge results, avoiding duplicates
        const allLandlords = [...landlords];
        localLandlords.forEach(local => {
          const exists = allLandlords.some(existing => 
            existing.name.toLowerCase() === local.name.toLowerCase() &&
            existing.location.toLowerCase() === local.location.toLowerCase()
          );
          if (!exists) {
            allLandlords.push(local);
          }
        });
        
        landlords = allLandlords;
      } else {
        // No search, just get local landlords
        landlords = await storage.getAllLandlords(
          sortBy as string | undefined,
          filterRating ? parseInt(filterRating as string) : undefined
        );
      }
      
      // Apply filtering and sorting to combined results
      if (filterRating) {
        const minRating = parseInt(filterRating as string);
        landlords = landlords.filter(landlord => 
          (landlord.averageRating || 0) >= minRating
        );
      }
      
      // Sort results
      switch (sortBy) {
        case 'highest-rated':
          landlords.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        case 'lowest-rated':
          landlords.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
          break;
        case 'most-reviews':
          landlords.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
          break;
        default:
          landlords.sort((a, b) => b.id - a.id); // Most recent
      }
      
      res.json(landlords);
    } catch (error) {
      console.error("Error fetching landlords:", error);
      res.status(500).json({ message: "Failed to fetch landlords" });
    }
  });

  // Get a specific landlord
  app.get("/api/landlords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const landlord = await storage.getLandlord(id);
      
      if (!landlord) {
        return res.status(404).json({ message: "Landlord not found" });
      }
      
      res.json(landlord);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch landlord" });
    }
  });

  // Create a new landlord
  app.post("/api/landlords", async (req, res) => {
    try {
      const result = insertLandlordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid landlord data", 
          errors: result.error.errors 
        });
      }

      // Check if landlord already exists
      const existing = await storage.getLandlordByName(result.data.name);
      if (existing) {
        return res.status(409).json({ message: "Landlord already exists" });
      }

      const landlord = await storage.createLandlord(result.data);
      res.status(201).json(landlord);
    } catch (error) {
      res.status(500).json({ message: "Failed to create landlord" });
    }
  });

  // Get reviews for a specific landlord
  app.get("/api/landlords/:id/reviews", async (req, res) => {
    try {
      const landlordId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByLandlord(landlordId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get all reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a new review
  app.post("/api/reviews", async (req, res) => {
    try {
      const result = insertReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid review data", 
          errors: result.error.errors 
        });
      }

      // Check if landlord exists
      const landlord = await storage.getLandlord(result.data.landlordId);
      if (!landlord) {
        return res.status(404).json({ message: "Landlord not found" });
      }

      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Vote on a review
  app.post("/api/reviews/:id/vote", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const voterIp = req.ip || req.connection.remoteAddress || "unknown";
      
      const voteSchema = z.object({
        isHelpful: z.boolean()
      });
      
      const result = voteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid vote data", 
          errors: result.error.errors 
        });
      }

      // Check if review exists
      const review = await storage.getReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Check if user already voted
      const existingVote = await storage.getVote(reviewId, voterIp);
      if (existingVote) {
        return res.status(409).json({ message: "You have already voted on this review" });
      }

      // Create vote and update review counts
      await storage.createVote({
        reviewId,
        voterIp,
        isHelpful: result.data.isHelpful
      });
      
      await storage.updateReviewVotes(reviewId, result.data.isHelpful, true);
      
      res.json({ message: "Vote recorded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
