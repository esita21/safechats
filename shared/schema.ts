import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for both parents and children
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isParent: boolean("is_parent").notNull().default(false),
  parentId: integer("parent_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default(""),
  avatarColor: text("avatar_color").default("#3b82f6"), // Default avatar color (blue)
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
  isFiltered: boolean("is_filtered").default(false), // Marked if contains inappropriate language
  isReviewed: boolean("is_reviewed").default(false) // Marked if parent has reviewed
});

// Friend connections
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: integer("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestTime: timestamp("request_time").notNull().defaultNow(),
});

// Friend request notification
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, requestTime: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, timestamp: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Additional schemas for specific operations
export const createChildSchema = insertUserSchema.extend({
  parentId: z.number().optional(),
}).omit({ isParent: true });

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  status: z.string().max(100, "Status cannot exceed 100 characters"),
  avatarColor: z.string(),
});

export const friendRequestResponseSchema = z.object({
  friendRequestId: z.number(),
  status: z.enum(["approved", "rejected"]),
});

export const messageReviewSchema = z.object({
  messageId: z.number(),
  isReviewed: z.boolean(),
  action: z.enum(["allow", "delete"]),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CreateChild = z.infer<typeof createChildSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type FriendRequestResponse = z.infer<typeof friendRequestResponseSchema>;
export type MessageReview = z.infer<typeof messageReviewSchema>;
