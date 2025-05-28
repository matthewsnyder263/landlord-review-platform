import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  averageRating: real("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
  depositReturnRating: real("deposit_return_rating").default(0),
  responsivenessRating: real("responsiveness_rating").default(0),
  ethicsRating: real("ethics_rating").default(0),
  maintenanceRating: real("maintenance_rating").default(0),
  communicationRating: real("communication_rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  userId: varchar("user_id"), // Link to authenticated user
  authorName: text("author_name"),
  isAnonymous: boolean("is_anonymous").default(false),
  overallRating: integer("overall_rating").notNull(),
  depositReturnRating: integer("deposit_return_rating").notNull(),
  responsivenessRating: integer("responsiveness_rating").notNull(),
  ethicsRating: integer("ethics_rating").notNull(),
  maintenanceRating: integer("maintenance_rating").notNull(),
  communicationRating: integer("communication_rating").notNull(),
  content: text("content").notNull(),
  helpfulVotes: integer("helpful_votes").default(0),
  notHelpfulVotes: integer("not_helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  userId: varchar("user_id"), // Link to authenticated user
  voterIp: text("voter_ip").notNull(),
  isHelpful: boolean("is_helpful").notNull(),
});

export const insertLandlordSchema = createInsertSchema(landlords).omit({
  id: true,
  averageRating: true,
  totalReviews: true,
  depositReturnRating: true,
  responsivenessRating: true,
  ethicsRating: true,
  maintenanceRating: true,
  communicationRating: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  helpfulVotes: true,
  notHelpfulVotes: true,
  createdAt: true,
}).extend({
  overallRating: z.number().min(1).max(5),
  depositReturnRating: z.number().min(1).max(5),
  responsivenessRating: z.number().min(1).max(5),
  ethicsRating: z.number().min(1).max(5),
  maintenanceRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  content: z.string().min(10, "Review must be at least 10 characters long"),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertLandlord = z.infer<typeof insertLandlordSchema>;
export type Landlord = typeof landlords.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
