import { landlords, reviews, votes, users, type Landlord, type Review, type Vote, type User, type InsertLandlord, type InsertReview, type InsertVote, type UpsertUser } from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Landlord operations
  getLandlord(id: number): Promise<Landlord | undefined>;
  getLandlordByName(name: string): Promise<Landlord | undefined>;
  createLandlord(landlord: InsertLandlord): Promise<Landlord>;
  updateLandlord(id: number, updates: Partial<Landlord>): Promise<Landlord | undefined>;
  searchLandlords(query: string, location?: string): Promise<Landlord[]>;
  getAllLandlords(sortBy?: string, filterRating?: number): Promise<Landlord[]>;
  
  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByLandlord(landlordId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAllReviews(): Promise<Review[]>;
  
  // Vote operations
  getVote(reviewId: number, voterIp: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateReviewVotes(reviewId: number, isHelpful: boolean, increment: boolean): Promise<void>;
}

export class MemStorage implements IStorage {
  private landlords: Map<number, Landlord>;
  private reviews: Map<number, Review>;
  private votes: Map<string, Vote>;
  private currentLandlordId: number;
  private currentReviewId: number;
  private currentVoteId: number;

  constructor() {
    this.landlords = new Map();
    this.reviews = new Map();
    this.votes = new Map();
    this.currentLandlordId = 1;
    this.currentReviewId = 1;
    this.currentVoteId = 1;

    // Seed with some initial data
    this.seedData();
  }

  private seedData() {
    // Add some sample landlords
    const sampleLandlords = [
      {
        name: "ABC Property Management",
        location: "San Francisco, CA",
        address: "123 Main St, San Francisco, CA",
        averageRating: 4.2,
        totalReviews: 23,
        depositReturnRating: 4.1,
        responsivenessRating: 4.8,
        ethicsRating: 3.2,
        maintenanceRating: 4.5,
        communicationRating: 4.3,
      },
      {
        name: "John Smith Properties",
        location: "Brooklyn, NY",
        address: "456 Oak Ave, Brooklyn, NY",
        averageRating: 2.1,
        totalReviews: 8,
        depositReturnRating: 1.2,
        responsivenessRating: 2.3,
        ethicsRating: 1.8,
        maintenanceRating: 2.5,
        communicationRating: 2.8,
      },
      {
        name: "Golden Gate Apartments",
        location: "San Francisco, CA",
        address: "789 Pine St, San Francisco, CA",
        averageRating: 4.9,
        totalReviews: 41,
        depositReturnRating: 4.9,
        responsivenessRating: 4.8,
        ethicsRating: 5.0,
        maintenanceRating: 4.7,
        communicationRating: 4.9,
      },
      {
        name: "Frederick Housing LLC",
        location: "Frederick, MD",
        address: "200 East St, Frederick, MD",
        averageRating: 3.5,
        totalReviews: 12,
        depositReturnRating: 3.2,
        responsivenessRating: 4.1,
        ethicsRating: 3.8,
        maintenanceRating: 3.3,
        communicationRating: 3.6,
      },
      {
        name: "Chesapeake Bay Rentals",
        location: "Baltimore, MD",
        address: "500 Harbor Dr, Baltimore, MD",
        averageRating: 2.8,
        totalReviews: 15,
        depositReturnRating: 2.1,
        responsivenessRating: 3.2,
        ethicsRating: 2.5,
        maintenanceRating: 3.1,
        communicationRating: 3.4,
      },
    ];

    sampleLandlords.forEach(landlord => {
      const id = this.currentLandlordId++;
      this.landlords.set(id, { ...landlord, id });
    });

    // Add some sample reviews
    const sampleReviews = [
      {
        landlordId: 1,
        authorName: "Anonymous Tenant",
        isAnonymous: true,
        overallRating: 4,
        depositReturnRating: 4,
        responsivenessRating: 5,
        ethicsRating: 3,
        maintenanceRating: 4,
        communicationRating: 4,
        content: "Great responsiveness to maintenance requests, but they held onto my security deposit for minor wear and tear that should have been normal. Overall decent experience but be careful about deposit terms.",
        helpfulVotes: 12,
        notHelpfulVotes: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        landlordId: 2,
        authorName: "Verified Tenant",
        isAnonymous: false,
        overallRating: 1,
        depositReturnRating: 1,
        responsivenessRating: 2,
        ethicsRating: 1,
        maintenanceRating: 2,
        communicationRating: 3,
        content: "Refused to accept my ESA letter despite legal requirements. Kept my entire deposit for 'cleaning fees' even though I left the place spotless. Avoid at all costs.",
        helpfulVotes: 18,
        notHelpfulVotes: 0,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        landlordId: 3,
        authorName: "Happy Tenant",
        isAnonymous: false,
        overallRating: 5,
        depositReturnRating: 5,
        responsivenessRating: 5,
        ethicsRating: 5,
        maintenanceRating: 5,
        communicationRating: 5,
        content: "Excellent landlord! Returned my full deposit, always responsive to requests, and very professional. They even helped coordinate with movers when I was leaving. Highly recommend!",
        helpfulVotes: 24,
        notHelpfulVotes: 0,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];

    sampleReviews.forEach(review => {
      const id = this.currentReviewId++;
      this.reviews.set(id, { ...review, id });
    });
  }

  async getLandlord(id: number): Promise<Landlord | undefined> {
    return this.landlords.get(id);
  }

  async getLandlordByName(name: string): Promise<Landlord | undefined> {
    return Array.from(this.landlords.values()).find(
      landlord => landlord.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createLandlord(insertLandlord: InsertLandlord): Promise<Landlord> {
    const id = this.currentLandlordId++;
    const landlord: Landlord = {
      ...insertLandlord,
      id,
      averageRating: 0,
      totalReviews: 0,
      depositReturnRating: 0,
      responsivenessRating: 0,
      ethicsRating: 0,
      maintenanceRating: 0,
      communicationRating: 0,
    };
    this.landlords.set(id, landlord);
    return landlord;
  }

  async updateLandlord(id: number, updates: Partial<Landlord>): Promise<Landlord | undefined> {
    const landlord = this.landlords.get(id);
    if (!landlord) return undefined;
    
    const updated = { ...landlord, ...updates };
    this.landlords.set(id, updated);
    return updated;
  }

  async searchLandlords(query: string, location?: string): Promise<Landlord[]> {
    const allLandlords = Array.from(this.landlords.values());
    const queryLower = query.toLowerCase();
    
    return allLandlords.filter(landlord => {
      const matchesQuery = landlord.name.toLowerCase().includes(queryLower) ||
                          (landlord.address && landlord.address.toLowerCase().includes(queryLower));
      
      // More flexible location matching - check if any part of the location matches
      let matchesLocation = true;
      if (location && location !== "All Locations") {
        const locationLower = location.toLowerCase();
        const landlordLocationLower = landlord.location.toLowerCase();
        const landlordAddressLower = (landlord.address || "").toLowerCase();
        
        // Split location into parts (city, state, etc.) for more flexible matching
        const locationParts = locationLower.split(/[,\s]+/).filter(part => part.length > 0);
        
        matchesLocation = locationParts.some(part => 
          landlordLocationLower.includes(part) || 
          landlordAddressLower.includes(part)
        );
      }
      
      return matchesQuery && matchesLocation;
    });
  }

  async getAllLandlords(sortBy?: string, filterRating?: number): Promise<Landlord[]> {
    let landlords = Array.from(this.landlords.values());
    
    if (filterRating) {
      landlords = landlords.filter(landlord => landlord.averageRating >= filterRating);
    }
    
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
    
    return landlords;
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByLandlord(landlordId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.landlordId === landlordId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = {
      ...insertReview,
      id,
      helpfulVotes: 0,
      notHelpfulVotes: 0,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    
    // Update landlord ratings
    await this.updateLandlordRatings(insertReview.landlordId);
    
    return review;
  }

  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getVote(reviewId: number, voterIp: string): Promise<Vote | undefined> {
    const key = `${reviewId}-${voterIp}`;
    return this.votes.get(key);
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.currentVoteId++;
    const vote: Vote = { ...insertVote, id };
    const key = `${insertVote.reviewId}-${insertVote.voterIp}`;
    this.votes.set(key, vote);
    return vote;
  }

  async updateReviewVotes(reviewId: number, isHelpful: boolean, increment: boolean): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) return;
    
    const delta = increment ? 1 : -1;
    if (isHelpful) {
      review.helpfulVotes = (review.helpfulVotes || 0) + delta;
    } else {
      review.notHelpfulVotes = (review.notHelpfulVotes || 0) + delta;
    }
    
    this.reviews.set(reviewId, review);
  }

  private async updateLandlordRatings(landlordId: number): Promise<void> {
    const landlord = this.landlords.get(landlordId);
    if (!landlord) return;
    
    const reviews = await this.getReviewsByLandlord(landlordId);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) return;
    
    const averageRating = reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews;
    const depositReturnRating = reviews.reduce((sum, review) => sum + review.depositReturnRating, 0) / totalReviews;
    const responsivenessRating = reviews.reduce((sum, review) => sum + review.responsivenessRating, 0) / totalReviews;
    const ethicsRating = reviews.reduce((sum, review) => sum + review.ethicsRating, 0) / totalReviews;
    const maintenanceRating = reviews.reduce((sum, review) => sum + review.maintenanceRating, 0) / totalReviews;
    const communicationRating = reviews.reduce((sum, review) => sum + review.communicationRating, 0) / totalReviews;
    
    await this.updateLandlord(landlordId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      depositReturnRating: Math.round(depositReturnRating * 10) / 10,
      responsivenessRating: Math.round(responsivenessRating * 10) / 10,
      ethicsRating: Math.round(ethicsRating * 10) / 10,
      maintenanceRating: Math.round(maintenanceRating * 10) / 10,
      communicationRating: Math.round(communicationRating * 10) / 10,
    });
  }
}

export const storage = new DatabaseStorage();
