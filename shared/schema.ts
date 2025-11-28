import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface User {
  id: number;
  email: string;
  username: string;
  phone: string;
  passwordHash: string;
  role: "admin" | "user";
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  securityQuestion3: string;
  securityAnswer3: string;
  isBlocked: boolean;
  failedAttempts: number;
  lastFailedAttempt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  email: string;
  username: string;
  phone: string;
  password: string;
  role?: "admin" | "user";
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  securityQuestion3: string;
  securityAnswer3: string;
}

export interface LoginAttempt {
  id: number;
  userId: number | null;
  email: string;
  ipAddress: string | null;
  success: boolean;
  userAgent: string | null;
  createdAt: Date;
}

export interface InsertLoginAttempt {
  userId: number | null;
  email: string;
  ipAddress: string | null;
  success: boolean;
  userAgent: string | null;
}

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

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AnnouncementTypeSchema = z.enum(["image", "video", "text"]);
export type AnnouncementType = z.infer<typeof AnnouncementTypeSchema>;

export interface Announcement {
  id: number;
  type: "image" | "video" | "text";
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertAnnouncement {
  type: "image" | "video" | "text";
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  active?: boolean;
}

export interface UserSettings {
  id: number;
  userId: number;
  churchName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SupportTicketStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

export interface SupportTicket {
  id: number;
  username: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertSupportTicket {
  username: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface UpdateSupportTicket {
  status?: SupportTicketStatus;
  adminResponse?: string;
}
