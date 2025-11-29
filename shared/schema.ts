import { z } from "zod";
import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const UserRoleSchema = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  securityQuestion1: text("security_question_1").notNull(),
  securityAnswer1: text("security_answer_1").notNull(),
  securityQuestion2: text("security_question_2").notNull(),
  securityAnswer2: text("security_answer_2").notNull(),
  securityQuestion3: text("security_question_3").notNull(),
  securityAnswer3: text("security_answer_3").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastFailedAttempt: timestamp("last_failed_attempt"),
  securityAnswerAttempts: integer("security_answer_attempts").notNull().default(0),
  isRecoveryBlocked: boolean("is_recovery_blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  success: boolean("success").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  loginAttempts: many(loginAttempts),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
  failedAttempts: true,
  lastFailedAttempt: true,
  isBlocked: true,
  securityAnswer1: true,
  securityAnswer2: true,
  securityAnswer3: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  securityAnswer1: z.string().min(1, "Resposta obrigatória"),
  securityAnswer2: z.string().min(1, "Resposta obrigatória"),
  securityAnswer3: z.string().min(1, "Resposta obrigatória"),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;

export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, "Email ou nome de usuário obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha obrigatória"),
  securityQuestion1: z.string().min(1, "Pergunta de segurança obrigatória"),
  securityAnswer1: z.string().min(1, "Resposta obrigatória"),
  securityQuestion2: z.string().min(1, "Pergunta de segurança obrigatória"),
  securityAnswer2: z.string().min(1, "Resposta obrigatória"),
  securityQuestion3: z.string().min(1, "Pergunta de segurança obrigatória"),
  securityAnswer3: z.string().min(1, "Resposta obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const SecurityQuestionsVerifySchema = z.object({
  identifier: z.string().min(1, "Email ou nome de usuário obrigatório"),
  answer1: z.string().min(1, "Resposta obrigatória"),
  answer2: z.string().min(1, "Resposta obrigatória"),
  answer3: z.string().min(1, "Resposta obrigatória"),
});

export type SecurityQuestionsVerify = z.infer<typeof SecurityQuestionsVerifySchema>;

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, "Email ou nome de usuário obrigatório"),
  answer1: z.string().min(1, "Resposta obrigatória"),
  answer2: z.string().min(1, "Resposta obrigatória"),
  answer3: z.string().min(1, "Resposta obrigatória"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmNewPassword: z.string().min(6, "Confirmação de senha obrigatória"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem",
  path: ["confirmNewPassword"],
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    role: UserRoleSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MediaTypeSchema = z.enum(["image", "video", "audio", "text"]);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const FitModeSchema = z.enum(["contain", "cover", "stretch", "crop"]);
export type FitMode = z.infer<typeof FitModeSchema>;

export const GalleryItemSchema = z.object({
  id: z.string(),
  type: MediaTypeSchema,
  name: z.string(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  createdAt: z.number(),
  textContent: z.string().optional(),
  textTitle: z.string().optional(),
  textColor: z.string().optional(),
  textBackgroundColor: z.string().optional(),
  textBold: z.boolean().optional(),
  textItalic: z.boolean().optional(),
  textUnderline: z.boolean().optional(),
  textSize: z.number().optional(),
  formattedContent: z.string().optional(),
});

export const InsertGalleryItemSchema = GalleryItemSchema.omit({ id: true, createdAt: true });
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type InsertGalleryItem = z.infer<typeof InsertGalleryItemSchema>;

export const PlaylistItemSchema = z.object({
  id: z.string(),
  galleryItemId: z.string(),
  order: z.number(),
  addedAt: z.number(),
});

export const InsertPlaylistItemSchema = PlaylistItemSchema.omit({ id: true, addedAt: true });
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type InsertPlaylistItem = z.infer<typeof InsertPlaylistItemSchema>;

export const MediaItemSchema = GalleryItemSchema.extend({
  order: z.number(),
});

export const InsertMediaItemSchema = MediaItemSchema.omit({ id: true, createdAt: true });
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type InsertMediaItem = z.infer<typeof InsertMediaItemSchema>;

export const TextOverlaySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  visible: z.boolean(),
});

export const InsertTextOverlaySchema = TextOverlaySchema.omit({ id: true });
export type TextOverlay = z.infer<typeof TextOverlaySchema>;
export type InsertTextOverlay = z.infer<typeof InsertTextOverlaySchema>;

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.string(),
  color: z.string(),
  textAlign: z.enum(["left", "center", "right"]),
  textShadow: z.string().optional(),
  backgroundColor: z.string().optional(),
  padding: z.number(),
});

export const InsertThemeSchema = ThemeSchema.omit({ id: true });
export type Theme = z.infer<typeof ThemeSchema>;
export type InsertTheme = z.infer<typeof InsertThemeSchema>;

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(z.string()),
  currentIndex: z.number(),
  autoPlay: z.boolean(),
  autoPlayInterval: z.number(),
  loop: z.boolean(),
  pauseAtEnd: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const InsertPlaylistSchema = PlaylistSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Playlist = z.infer<typeof PlaylistSchema>;
export type InsertPlaylist = z.infer<typeof InsertPlaylistSchema>;

export const AppSettingsSchema = z.object({
  volume: z.number().min(0).max(100),
  muted: z.boolean(),
  showProjector: z.boolean(),
  currentThemeId: z.string().optional(),
  fitMode: FitModeSchema,
  zoom: z.number(),
  panX: z.number(),
  panY: z.number(),
  slideDuration: z.number(),
  textFontSize: z.number().optional(),
  autoFitText: z.boolean().optional(),
  darkScreen: z.boolean(),
  blackScreen: z.boolean().optional(),
  showLogo: z.boolean().optional(),
  logoUrl: z.string().optional(),
  isLive: z.boolean().optional(),
  waitingMessageTitle: z.string().optional(),
  waitingMessageSubtitle: z.string().optional(),
});

export const InsertAppSettingsSchema = AppSettingsSchema.partial();
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type InsertAppSettings = z.infer<typeof InsertAppSettingsSchema>;

export const ExportDataSchema = z.object({
  playlists: z.array(PlaylistSchema),
  mediaItems: z.array(MediaItemSchema),
  themes: z.array(ThemeSchema),
  exportDate: z.string(),
});

export type ExportData = z.infer<typeof ExportDataSchema>;

export const AnnouncementTypeSchema = z.enum(["image", "video", "text"]);
export type AnnouncementType = z.infer<typeof AnnouncementTypeSchema>;

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["image", "video", "text"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const AnnouncementSchema = z.object({
  id: z.number(),
  type: AnnouncementTypeSchema,
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertAnnouncementSchema = AnnouncementSchema.omit({ id: true, createdAt: true, updatedAt: true });

export const UserSettingsSchema = z.object({
  id: z.number(),
  userId: z.number(),
  churchName: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const SupportTicketStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

export const SupportTicketSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  subject: z.string(),
  message: z.string(),
  status: SupportTicketStatusSchema,
  adminResponse: z.string().optional(),
  respondedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertSupportTicketSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof InsertSupportTicketSchema>;

export const UpdateSupportTicketSchema = z.object({
  status: SupportTicketStatusSchema.optional(),
  adminResponse: z.string().optional(),
});

export type UpdateSupportTicket = z.infer<typeof UpdateSupportTicketSchema>;

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  slideshowInterval: integer("slideshow_interval").notNull().default(5000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const UpdateSystemSettingsSchema = z.object({
  slideshowInterval: z.number().min(1000).max(30000).optional(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type UpdateSystemSettings = z.infer<typeof UpdateSystemSettingsSchema>;
