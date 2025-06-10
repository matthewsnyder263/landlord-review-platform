import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { rentCastService } from "./rentcast-service";
import { propertyScraperService } from "./property-scraper";
import { insertLandlordSchema, insertReviewSchema, insertVoteSchema, insertContributionSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

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

  // Enhanced search with real property owner data
  app.get("/api/enhanced-search", async (req, res) => {
    try {
      const { search, location } = req.query;
      
      if (!search || !location) {
        return res.status(400).json({ message: "Search query and location are required" });
      }

      // First get properties from RentCast
      const rentCastProperties = await rentCastService.searchProperties(
        search as string, 
        location as string
      );

      // Enhance each property with real owner information
      const enhancedProperties = await Promise.all(
        rentCastProperties.map(async (property) => {
          try {
            // Try to get real property owner information
            const ownerInfo = await propertyScraperService.getPropertyOwner(
              property.address || property.name,
              property.location,
              'US' // You could parse state from location
            );

            if (ownerInfo && ownerInfo.success) {
              // Create or update landlord with real owner name
              const existingLandlord = await storage.getLandlordByName(ownerInfo.ownerName);
              
              if (existingLandlord) {
                return existingLandlord;
              } else {
                // Create new landlord with real owner info
                const newLandlord = await storage.createLandlord({
                  name: ownerInfo.ownerName,
                  location: property.location,
                  address: property.address || property.name
                });
                return newLandlord;
              }
            }
            
            // If scraping fails, return the original property
            return property;
          } catch (error) {
            console.error('Error enhancing property with owner info:', error);
            return property;
          }
        })
      );

      res.json(enhancedProperties);
    } catch (error) {
      console.error('Enhanced search error:', error);
      res.status(500).json({ message: "Failed to perform enhanced search" });
    }
  });

  // Test endpoint for Frederick County property scraping
  app.get("/api/test-frederick-scraping", async (req, res) => {
    try {
      const testAddress = "100 N Market St"; // A real address in Frederick, MD
      const result = await propertyScraperService.getPropertyOwner(
        testAddress,
        "Frederick",
        "MD"
      );
      
      res.json({
        address: testAddress,
        result: result,
        success: result?.success || false,
        message: result ? "Property owner data found!" : "No property owner data found"
      });
    } catch (error) {
      console.error('Frederick test error:', error);
      res.status(500).json({ 
        message: "Error testing Frederick County scraping",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Community contribution endpoint
  app.post("/api/contribute-landlord-name", async (req, res) => {
    try {
      const result = insertContributionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: result.error.errors 
        });
      }

      const contributorIp = req.ip || req.connection.remoteAddress || "unknown";
      
      // Check if this IP already contributed for this landlord
      const existingContribution = await storage.getContributionByIpAndLandlord(
        contributorIp, 
        result.data.landlordId
      );

      if (existingContribution) {
        return res.status(409).json({ 
          message: "You have already contributed information for this property" 
        });
      }

      // Create the contribution
      const contribution = await storage.createContribution({
        ...result.data,
        contributorIp
      });

      res.status(201).json({ 
        message: "Thank you for your contribution!",
        contribution 
      });
    } catch (error) {
      console.error("Error saving contribution:", error);
      res.status(500).json({ message: "Failed to save contribution" });
    }
  });

  // Create subscription payment intent
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { plan } = req.body;
      
      // Define subscription prices (in cents)
      const subscriptionPrices = {
        "Premium Tenant": 999,  // $9.99
        "Landlord Pro": 2999    // $29.99
      };

      const amount = subscriptionPrices[plan as keyof typeof subscriptionPrices];
      if (!amount) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      // Create a payment intent for subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          subscription_plan: plan,
          type: "subscription"
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ 
        message: "Error creating subscription payment intent: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
