import { landlords, reviews, votes, users, landlordContributions, type Landlord, type Review, type Vote, type User, type InsertLandlord, type InsertReview, type InsertVote, type UpsertUser, type LandlordContribution, type InsertContribution } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Landlord operations
  async getLandlord(id: number): Promise<Landlord | undefined> {
    const [landlord] = await db.select().from(landlords).where(eq(landlords.id, id));
    return landlord;
  }

  async getLandlordByName(name: string): Promise<Landlord | undefined> {
    const [landlord] = await db.select().from(landlords).where(eq(landlords.name, name));
    return landlord;
  }

  async createLandlord(insertLandlord: InsertLandlord): Promise<Landlord> {
    const [landlord] = await db
      .insert(landlords)
      .values(insertLandlord)
      .returning();
    return landlord;
  }

  async updateLandlord(id: number, updates: Partial<Landlord>): Promise<Landlord | undefined> {
    const [landlord] = await db
      .update(landlords)
      .set(updates)
      .where(eq(landlords.id, id))
      .returning();
    return landlord;
  }

  async searchLandlords(query: string, location?: string): Promise<Landlord[]> {
    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          ilike(landlords.name, `%${query}%`),
          ilike(landlords.address, `%${query}%`)
        )
      );
    }

    if (location && location !== "All Locations") {
      const locationParts = location.toLowerCase().split(/[,\s]+/).filter(part => part.length > 0);
      const locationConditions = locationParts.map(part =>
        or(
          ilike(landlords.location, `%${part}%`),
          ilike(landlords.address, `%${part}%`)
        )
      );
      whereConditions.push(or(...locationConditions));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db
      .select()
      .from(landlords)
      .where(whereClause)
      .orderBy(desc(landlords.id));
  }

  async getAllLandlords(sortBy?: string, filterRating?: number): Promise<Landlord[]> {
    let query = db.select().from(landlords);

    if (filterRating) {
      query = query.where(sql`${landlords.averageRating} >= ${filterRating}`);
    }

    switch (sortBy) {
      case 'highest-rated':
        query = query.orderBy(desc(landlords.averageRating));
        break;
      case 'lowest-rated':
        query = query.orderBy(landlords.averageRating);
        break;
      case 'most-reviews':
        query = query.orderBy(desc(landlords.totalReviews));
        break;
      default:
        query = query.orderBy(desc(landlords.id));
    }

    return await query;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByLandlord(landlordId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.landlordId, landlordId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    
    // Update landlord ratings
    await this.updateLandlordRatings(insertReview.landlordId);
    
    return review;
  }

  async getAllReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt));
  }

  // Vote operations
  async getVote(reviewId: number, voterIp: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.reviewId, reviewId), eq(votes.voterIp, voterIp)));
    return vote;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db
      .insert(votes)
      .values(insertVote)
      .returning();
    return vote;
  }

  async updateReviewVotes(reviewId: number, isHelpful: boolean, increment: boolean): Promise<void> {
    const delta = increment ? 1 : -1;
    
    if (isHelpful) {
      await db
        .update(reviews)
        .set({ 
          helpfulVotes: sql`${reviews.helpfulVotes} + ${delta}` 
        })
        .where(eq(reviews.id, reviewId));
    } else {
      await db
        .update(reviews)
        .set({ 
          notHelpfulVotes: sql`${reviews.notHelpfulVotes} + ${delta}` 
        })
        .where(eq(reviews.id, reviewId));
    }
  }

  private async updateLandlordRatings(landlordId: number): Promise<void> {
    const landlordReviews = await this.getReviewsByLandlord(landlordId);
    const totalReviews = landlordReviews.length;
    
    if (totalReviews === 0) return;
    
    const averageRating = landlordReviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews;
    const depositReturnRating = landlordReviews.reduce((sum, review) => sum + review.depositReturnRating, 0) / totalReviews;
    const responsivenessRating = landlordReviews.reduce((sum, review) => sum + review.responsivenessRating, 0) / totalReviews;
    const ethicsRating = landlordReviews.reduce((sum, review) => sum + review.ethicsRating, 0) / totalReviews;
    const maintenanceRating = landlordReviews.reduce((sum, review) => sum + review.maintenanceRating, 0) / totalReviews;
    const communicationRating = landlordReviews.reduce((sum, review) => sum + review.communicationRating, 0) / totalReviews;
    
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