import { type User, type InsertUser, type LoginAttempt, type InsertLoginAttempt, type Announcement, type InsertAnnouncement, type UserSettings, type SupportTicket, type InsertSupportTicket, type UpdateSupportTicket, type SupportTicketStatus, type SystemSettings, type UpdateSystemSettings } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const LOGIN_ATTEMPTS_FILE = path.join(DATA_DIR, "login_attempts.json");
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, "announcements.json");
const USER_SETTINGS_FILE = path.join(DATA_DIR, "user_settings.json");
const SUPPORT_TICKETS_FILE = path.join(DATA_DIR, "support_tickets.json");

interface StorageData {
  users: User[];
  nextUserId: number;
}

interface LoginAttemptsData {
  attempts: LoginAttempt[];
  nextAttemptId: number;
}

interface AnnouncementsData {
  announcements: Announcement[];
  nextAnnouncementId: number;
}

interface UserSettingsData {
  settings: UserSettings[];
  nextSettingsId: number;
}

interface SupportTicketsData {
  tickets: SupportTicket[];
  nextTicketId: number;
}

export interface SecurityQuestions {
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  question3: string;
  answer3: string;
}

export interface IStorage {
  addUser(
    email: string,
    username: string,
    phone: string,
    password: string,
    role: "admin" | "user",
    securityQuestions: SecurityQuestions
  ): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  getUserByIdentifier(identifier: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  verifySecurityAnswers(userId: number, answer1: string, answer2: string, answer3: string): Promise<boolean>;
  getSecurityQuestions(identifier: string): Promise<{ question1: string; question2: string; question3: string } | null>;
  updatePassword(userId: number, newPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  incrementFailedAttempts(id: number): Promise<void>;
  resetFailedAttempts(id: number): Promise<void>;
  blockUser(id: number): Promise<void>;
  unblockUser(id: number): Promise<void>;
  logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(userId?: number, limit?: number): Promise<LoginAttempt[]>;
  getRecentFailedAttempts(email: string, minutes: number): Promise<number>;
  getRecentFailedAttemptsByIp(ipAddress: string, minutes: number): Promise<number>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  getAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(id: number): Promise<Announcement | null>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null>;
  deleteAnnouncement(id: number): Promise<boolean>;
  getUserSettings(userId: number): Promise<UserSettings | null>;
  updateUserSettings(userId: number, data: Partial<{ churchName: string }>): Promise<UserSettings>;
  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | null>;
  updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket | null>;
  deleteSupportTicket(id: number): Promise<boolean>;
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(data: UpdateSystemSettings): Promise<SystemSettings>;
  init(): Promise<void>;
}

function getInitialUsers(): { email: string; username: string; password: string; role: "admin" | "user" }[] {
  const users: { email: string; username: string; password: string; role: "admin" | "user" }[] = [];
  
  const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "demo123456";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  
  users.push({
    email: adminEmail,
    username: adminUsername,
    password: adminPassword,
    role: "admin",
  });
  console.log(`Admin configured: ${adminEmail}`);
  
  // Sempre add usuário de demo para testes
  if (!process.env.ADMIN_EMAIL) {
    users.push({
      email: "user@demo.com",
      username: "user",
      password: "demo123456",
      role: "user",
    });
    console.log("Demo users created");
  }
  
  return users;
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private loginAttempts: LoginAttempt[] = [];
  private nextUserId = 1;
  private nextAttemptId = 1;

  async init() {
    const initialUsers = getInitialUsers();
    for (const user of initialUsers) {
      const existing = await this.getUserByEmail(user.email);
      if (!existing) {
        await this.addUser(user.email, user.username, "", user.password, user.role, {
          question1: "Pergunta padrão",
          answer1: "resposta",
          question2: "Pergunta padrão",
          answer2: "resposta",
          question3: "Pergunta padrão",
          answer3: "resposta",
        });
      }
    }
  }

  async addUser(
    email: string,
    username: string,
    phone: string,
    password: string,
    role: "admin" | "user",
    securityQuestions: SecurityQuestions
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const answerHash1 = await bcrypt.hash(securityQuestions.answer1.toLowerCase().trim(), 10);
    const answerHash2 = await bcrypt.hash(securityQuestions.answer2.toLowerCase().trim(), 10);
    const answerHash3 = await bcrypt.hash(securityQuestions.answer3.toLowerCase().trim(), 10);
    const now = new Date();
    const user: User = {
      id: this.nextUserId++,
      email,
      username,
      phone,
      passwordHash,
      role,
      securityQuestion1: securityQuestions.question1,
      securityAnswer1: answerHash1,
      securityQuestion2: securityQuestions.question2,
      securityAnswer2: answerHash2,
      securityQuestion3: securityQuestions.question3,
      securityAnswer3: answerHash3,
      isBlocked: false,
      failedAttempts: 0,
      lastFailedAttempt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }

  async verifySecurityAnswers(userId: number, answer1: string, answer2: string, answer3: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    const match1 = await bcrypt.compare(answer1.toLowerCase().trim(), user.securityAnswer1);
    const match2 = await bcrypt.compare(answer2.toLowerCase().trim(), user.securityAnswer2);
    const match3 = await bcrypt.compare(answer3.toLowerCase().trim(), user.securityAnswer3);
    
    return match1 && match2 && match3;
  }

  async getSecurityQuestions(identifier: string): Promise<{ question1: string; question2: string; question3: string } | null> {
    const user = await this.getUserByIdentifier(identifier);
    if (!user) return null;
    
    return {
      question1: user.securityQuestion1,
      question2: user.securityQuestion2,
      question3: user.securityQuestion3,
    };
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.updateUser(userId, { passwordHash });
    return result !== null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    return this.users.find(u => u.phone === phone) || null;
  }

  async getUserByIdentifier(identifier: string): Promise<User | null> {
    return this.users.find(u => u.email === identifier || u.username === identifier) || null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    this.users.splice(userIndex, 1);
    return true;
  }

  async incrementFailedAttempts(id: number): Promise<void> {
    const user = await this.getUserById(id);
    if (user) {
      await this.updateUser(id, {
        failedAttempts: user.failedAttempts + 1,
        lastFailedAttempt: new Date(),
      });
    }
  }

  async resetFailedAttempts(id: number): Promise<void> {
    await this.updateUser(id, {
      failedAttempts: 0,
      lastFailedAttempt: null,
    });
  }

  async blockUser(id: number): Promise<void> {
    await this.updateUser(id, { isBlocked: true });
  }

  async unblockUser(id: number): Promise<void> {
    await this.updateUser(id, { isBlocked: false, failedAttempts: 0 });
  }

  async logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const log: LoginAttempt = {
      id: this.nextAttemptId++,
      ...attempt,
      createdAt: new Date(),
    };
    this.loginAttempts.push(log);
    return log;
  }

  async getLoginAttempts(userId?: number, limit: number = 50): Promise<LoginAttempt[]> {
    let attempts = [...this.loginAttempts];
    if (userId !== undefined) {
      attempts = attempts.filter(a => a.userId === userId);
    }
    return attempts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentFailedAttempts(email: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.loginAttempts.filter(
      a => a.email === email && !a.success && a.createdAt >= cutoff
    ).length;
  }

  async getRecentFailedAttemptsByIp(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.loginAttempts.filter(
      a => a.ipAddress === ipAddress && !a.success && a.createdAt >= cutoff
    ).length;
  }

  private announcements: Announcement[] = [];
  private nextAnnouncementId = 1;
  private userSettings: UserSettings[] = [];
  private nextSettingsId = 1;
  private supportTickets: SupportTicket[] = [];
  private nextTicketId = 1;

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const now = new Date();
    const announcement: Announcement = {
      id: this.nextAnnouncementId++,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.announcements.push(announcement);
    return announcement;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return [...this.announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcements
      .filter(a => a.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAnnouncementById(id: number): Promise<Announcement | null> {
    return this.announcements.find(a => a.id === id) || null;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null> {
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.announcements[idx] = {
      ...this.announcements[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.announcements[idx];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.announcements.splice(idx, 1);
    return true;
  }

  async getUserSettings(userId: number): Promise<UserSettings | null> {
    return this.userSettings.find(s => s.userId === userId) || null;
  }

  async updateUserSettings(userId: number, data: Partial<{ churchName: string }>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const idx = this.userSettings.findIndex(s => s.userId === userId);
      this.userSettings[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      return this.userSettings[idx];
    }
    const now = new Date();
    const settings: UserSettings = {
      id: this.nextSettingsId++,
      userId,
      churchName: data.churchName,
      createdAt: now,
      updatedAt: now,
    };
    this.userSettings.push(settings);
    return settings;
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const now = new Date();
    const ticket: SupportTicket = {
      id: this.nextTicketId++,
      ...data,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.supportTickets.push(ticket);
    return ticket;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return [...this.supportTickets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | null> {
    return this.supportTickets.find(t => t.id === id) || null;
  }

  async updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket | null> {
    const idx = this.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const now = new Date();
    this.supportTickets[idx] = {
      ...this.supportTickets[idx],
      ...data,
      respondedAt: data.adminResponse ? now : this.supportTickets[idx].respondedAt,
      updatedAt: now,
    };
    return this.supportTickets[idx];
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    const idx = this.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.supportTickets.splice(idx, 1);
    return true;
  }

  private systemSettings: SystemSettings = {
    id: 1,
    slideshowInterval: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(data: UpdateSystemSettings): Promise<SystemSettings> {
    this.systemSettings = {
      ...this.systemSettings,
      ...data,
      updatedAt: new Date(),
    };
    return this.systemSettings;
  }
}

export class FileStorage implements IStorage {
  private users: User[] = [];
  private loginAttempts: LoginAttempt[] = [];
  private nextUserId = 1;
  private nextAttemptId = 1;

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadUsers(): void {
    this.ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as StorageData;
        this.users = data.users.map(u => ({
          ...u,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
          lastFailedAttempt: u.lastFailedAttempt ? new Date(u.lastFailedAttempt) : null,
        }));
        this.nextUserId = data.nextUserId;
      } catch {
        this.users = [];
        this.nextUserId = 1;
      }
    }
  }

  private saveUsers(): void {
    this.ensureDataDir();
    const data: StorageData = {
      users: this.users,
      nextUserId: this.nextUserId,
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  private loadLoginAttempts(): void {
    this.ensureDataDir();
    if (fs.existsSync(LOGIN_ATTEMPTS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(LOGIN_ATTEMPTS_FILE, "utf-8")) as LoginAttemptsData;
        this.loginAttempts = data.attempts.map(a => ({
          ...a,
          createdAt: new Date(a.createdAt),
        }));
        this.nextAttemptId = data.nextAttemptId;
      } catch {
        this.loginAttempts = [];
        this.nextAttemptId = 1;
      }
    }
  }

  private saveLoginAttempts(): void {
    this.ensureDataDir();
    const data: LoginAttemptsData = {
      attempts: this.loginAttempts,
      nextAttemptId: this.nextAttemptId,
    };
    fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  async init() {
    this.loadUsers();
    this.loadLoginAttempts();
    
    // Only create demo users if no users exist at all (fresh install)
    if (this.users.length > 0) {
      console.log(`Found ${this.users.length} existing users, skipping demo user creation`);
      return;
    }
    
    const initialUsers = getInitialUsers();
    for (const user of initialUsers) {
      const existing = await this.getUserByEmail(user.email);
      if (!existing) {
        await this.addUser(user.email, user.username, "", user.password, user.role, {
          question1: "Pergunta padrão",
          answer1: "resposta",
          question2: "Pergunta padrão",
          answer2: "resposta",
          question3: "Pergunta padrão",
          answer3: "resposta",
        });
      }
    }
  }

  async addUser(
    email: string,
    username: string,
    phone: string,
    password: string,
    role: "admin" | "user",
    securityQuestions: SecurityQuestions
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const answerHash1 = await bcrypt.hash(securityQuestions.answer1.toLowerCase().trim(), 10);
    const answerHash2 = await bcrypt.hash(securityQuestions.answer2.toLowerCase().trim(), 10);
    const answerHash3 = await bcrypt.hash(securityQuestions.answer3.toLowerCase().trim(), 10);
    const now = new Date();
    const user: User = {
      id: this.nextUserId++,
      email,
      username,
      phone,
      passwordHash,
      role,
      securityQuestion1: securityQuestions.question1,
      securityAnswer1: answerHash1,
      securityQuestion2: securityQuestions.question2,
      securityAnswer2: answerHash2,
      securityQuestion3: securityQuestions.question3,
      securityAnswer3: answerHash3,
      isBlocked: false,
      failedAttempts: 0,
      lastFailedAttempt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  async verifySecurityAnswers(userId: number, answer1: string, answer2: string, answer3: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    const match1 = await bcrypt.compare(answer1.toLowerCase().trim(), user.securityAnswer1);
    const match2 = await bcrypt.compare(answer2.toLowerCase().trim(), user.securityAnswer2);
    const match3 = await bcrypt.compare(answer3.toLowerCase().trim(), user.securityAnswer3);
    
    return match1 && match2 && match3;
  }

  async getSecurityQuestions(identifier: string): Promise<{ question1: string; question2: string; question3: string } | null> {
    const user = await this.getUserByIdentifier(identifier);
    if (!user) return null;
    
    return {
      question1: user.securityQuestion1,
      question2: user.securityQuestion2,
      question3: user.securityQuestion3,
    };
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.updateUser(userId, { passwordHash });
    return result !== null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    return this.users.find(u => u.phone === phone) || null;
  }

  async getUserByIdentifier(identifier: string): Promise<User | null> {
    return this.users.find(u => u.email === identifier || u.username === identifier) || null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveUsers();
    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    this.users.splice(userIndex, 1);
    this.saveUsers();
    return true;
  }

  async incrementFailedAttempts(id: number): Promise<void> {
    const user = await this.getUserById(id);
    if (user) {
      await this.updateUser(id, {
        failedAttempts: user.failedAttempts + 1,
        lastFailedAttempt: new Date(),
      });
    }
  }

  async resetFailedAttempts(id: number): Promise<void> {
    await this.updateUser(id, {
      failedAttempts: 0,
      lastFailedAttempt: null,
    });
  }

  async blockUser(id: number): Promise<void> {
    await this.updateUser(id, { isBlocked: true });
  }

  async unblockUser(id: number): Promise<void> {
    await this.updateUser(id, { isBlocked: false, failedAttempts: 0 });
  }

  async logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const log: LoginAttempt = {
      id: this.nextAttemptId++,
      ...attempt,
      createdAt: new Date(),
    };
    this.loginAttempts.push(log);
    this.saveLoginAttempts();
    return log;
  }

  async getLoginAttempts(userId?: number, limit: number = 50): Promise<LoginAttempt[]> {
    let attempts = [...this.loginAttempts];
    if (userId !== undefined) {
      attempts = attempts.filter(a => a.userId === userId);
    }
    return attempts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentFailedAttempts(email: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.loginAttempts.filter(
      a => a.email === email && !a.success && a.createdAt >= cutoff
    ).length;
  }

  async getRecentFailedAttemptsByIp(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.loginAttempts.filter(
      a => a.ipAddress === ipAddress && !a.success && a.createdAt >= cutoff
    ).length;
  }

  private announcements: Announcement[] = [];
  private nextAnnouncementId = 1;
  private userSettings: UserSettings[] = [];
  private nextSettingsId = 1;

  private loadAnnouncements(): void {
    this.ensureDataDir();
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, "utf-8")) as AnnouncementsData;
        this.announcements = data.announcements.map(a => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }));
        this.nextAnnouncementId = data.nextAnnouncementId;
      } catch {
        this.announcements = [];
        this.nextAnnouncementId = 1;
      }
    }
  }

  private saveAnnouncements(): void {
    this.ensureDataDir();
    const data: AnnouncementsData = {
      announcements: this.announcements,
      nextAnnouncementId: this.nextAnnouncementId,
    };
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  private loadUserSettings(): void {
    this.ensureDataDir();
    if (fs.existsSync(USER_SETTINGS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(USER_SETTINGS_FILE, "utf-8")) as UserSettingsData;
        this.userSettings = data.settings.map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        this.nextSettingsId = data.nextSettingsId;
      } catch {
        this.userSettings = [];
        this.nextSettingsId = 1;
      }
    }
  }

  private saveUserSettings(): void {
    this.ensureDataDir();
    const data: UserSettingsData = {
      settings: this.userSettings,
      nextSettingsId: this.nextSettingsId,
    };
    fs.writeFileSync(USER_SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    this.loadAnnouncements();
    const now = new Date();
    const announcement: Announcement = {
      id: this.nextAnnouncementId++,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.announcements.push(announcement);
    this.saveAnnouncements();
    return announcement;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    this.loadAnnouncements();
    return [...this.announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    this.loadAnnouncements();
    return this.announcements
      .filter(a => a.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAnnouncementById(id: number): Promise<Announcement | null> {
    this.loadAnnouncements();
    return this.announcements.find(a => a.id === id) || null;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null> {
    this.loadAnnouncements();
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.announcements[idx] = {
      ...this.announcements[idx],
      ...data,
      updatedAt: new Date(),
    };
    this.saveAnnouncements();
    return this.announcements[idx];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    this.loadAnnouncements();
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.announcements.splice(idx, 1);
    this.saveAnnouncements();
    return true;
  }

  async getUserSettings(userId: number): Promise<UserSettings | null> {
    this.loadUserSettings();
    return this.userSettings.find(s => s.userId === userId) || null;
  }

  async updateUserSettings(userId: number, data: Partial<{ churchName: string }>): Promise<UserSettings> {
    this.loadUserSettings();
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const idx = this.userSettings.findIndex(s => s.userId === userId);
      this.userSettings[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      this.saveUserSettings();
      return this.userSettings[idx];
    }
    const now = new Date();
    const settings: UserSettings = {
      id: this.nextSettingsId++,
      userId,
      churchName: data.churchName,
      createdAt: now,
      updatedAt: now,
    };
    this.userSettings.push(settings);
    this.saveUserSettings();
    return settings;
  }

  private supportTickets: SupportTicket[] = [];
  private nextTicketId = 1;

  private loadSupportTickets(): void {
    this.ensureDataDir();
    if (fs.existsSync(SUPPORT_TICKETS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(SUPPORT_TICKETS_FILE, "utf-8")) as SupportTicketsData;
        this.supportTickets = data.tickets.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          respondedAt: t.respondedAt ? new Date(t.respondedAt) : undefined,
        }));
        this.nextTicketId = data.nextTicketId;
      } catch {
        this.supportTickets = [];
        this.nextTicketId = 1;
      }
    }
  }

  private saveSupportTickets(): void {
    this.ensureDataDir();
    const data: SupportTicketsData = {
      tickets: this.supportTickets,
      nextTicketId: this.nextTicketId,
    };
    fs.writeFileSync(SUPPORT_TICKETS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    this.loadSupportTickets();
    const now = new Date();
    const ticket: SupportTicket = {
      id: this.nextTicketId++,
      ...data,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.supportTickets.push(ticket);
    this.saveSupportTickets();
    return ticket;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    this.loadSupportTickets();
    return [...this.supportTickets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | null> {
    this.loadSupportTickets();
    return this.supportTickets.find(t => t.id === id) || null;
  }

  async updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket | null> {
    this.loadSupportTickets();
    const idx = this.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const now = new Date();
    this.supportTickets[idx] = {
      ...this.supportTickets[idx],
      ...data,
      respondedAt: data.adminResponse ? now : this.supportTickets[idx].respondedAt,
      updatedAt: now,
    };
    this.saveSupportTickets();
    return this.supportTickets[idx];
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    this.loadSupportTickets();
    const idx = this.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.supportTickets.splice(idx, 1);
    this.saveSupportTickets();
    return true;
  }

  private systemSettings: SystemSettings = {
    id: 1,
    slideshowInterval: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(data: UpdateSystemSettings): Promise<SystemSettings> {
    this.systemSettings = {
      ...this.systemSettings,
      ...data,
      updatedAt: new Date(),
    };
    return this.systemSettings;
  }
}

export class DatabaseStorage implements IStorage {
  private systemSettingsTableChecked = false;
  
  private async ensureSystemSettingsTable(): Promise<void> {
    if (this.systemSettingsTableChecked) return;
    
    try {
      const { pool } = await import("./db.js");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          slideshow_interval INTEGER NOT NULL DEFAULT 5000,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      this.systemSettingsTableChecked = true;
    } catch (error) {
      console.error("Error ensuring system_settings table:", error);
    }
  }
  
  async init() {
    const initialUsers = getInitialUsers();
    for (const user of initialUsers) {
      const existing = await this.getUserByEmail(user.email);
      if (!existing) {
        await this.addUser(user.email, user.username, "", user.password, user.role, {
          question1: "Pergunta padrão",
          answer1: "resposta",
          question2: "Pergunta padrão",
          answer2: "resposta",
          question3: "Pergunta padrão",
          answer3: "resposta",
        });
      }
    }
  }

  async addUser(
    email: string,
    username: string,
    phone: string,
    password: string,
    role: "admin" | "user",
    securityQuestions: SecurityQuestions
  ): Promise<User> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const passwordHash = await bcrypt.hash(password, 10);
    const answerHash1 = await bcrypt.hash(securityQuestions.answer1.toLowerCase().trim(), 10);
    const answerHash2 = await bcrypt.hash(securityQuestions.answer2.toLowerCase().trim(), 10);
    const answerHash3 = await bcrypt.hash(securityQuestions.answer3.toLowerCase().trim(), 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        username,
        phone,
        passwordHash,
        role,
        securityQuestion1: securityQuestions.question1,
        securityAnswer1: answerHash1,
        securityQuestion2: securityQuestions.question2,
        securityAnswer2: answerHash2,
        securityQuestion3: securityQuestions.question3,
        securityAnswer3: answerHash3,
      })
      .returning();
    return user;
  }

  async verifySecurityAnswers(userId: number, answer1: string, answer2: string, answer3: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    const match1 = await bcrypt.compare(answer1.toLowerCase().trim(), user.securityAnswer1);
    const match2 = await bcrypt.compare(answer2.toLowerCase().trim(), user.securityAnswer2);
    const match3 = await bcrypt.compare(answer3.toLowerCase().trim(), user.securityAnswer3);
    
    return match1 && match2 && match3;
  }

  async getSecurityQuestions(identifier: string): Promise<{ question1: string; question2: string; question3: string } | null> {
    const user = await this.getUserByIdentifier(identifier);
    if (!user) return null;
    
    return {
      question1: user.securityQuestion1,
      question2: user.securityQuestion2,
      question3: user.securityQuestion3,
    };
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.updateUser(userId, { passwordHash });
    return result !== null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || null;
  }

  async getUserByIdentifier(identifier: string): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq, or } = await import("drizzle-orm");
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)));
    return user || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getAllUsers(): Promise<User[]> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { desc } = await import("drizzle-orm");
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async incrementFailedAttempts(id: number): Promise<void> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const user = await this.getUserById(id);
    if (user) {
      await db
        .update(users)
        .set({
          failedAttempts: user.failedAttempts + 1,
          lastFailedAttempt: new Date(),
        })
        .where(eq(users.id, id));
    }
  }

  async resetFailedAttempts(id: number): Promise<void> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    await db
      .update(users)
      .set({
        failedAttempts: 0,
        lastFailedAttempt: null,
      })
      .where(eq(users.id, id));
  }

  async blockUser(id: number): Promise<void> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ isBlocked: true }).where(eq(users.id, id));
  }

  async unblockUser(id: number): Promise<void> {
    const { db } = await import("./db.js");
    const { users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    await db
      .update(users)
      .set({ isBlocked: false, failedAttempts: 0 })
      .where(eq(users.id, id));
  }

  async logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const { db } = await import("./db.js");
    const { loginAttempts } = await import("../shared/schema.js");
    const [log] = await db.insert(loginAttempts).values(attempt).returning();
    return log;
  }

  async getLoginAttempts(userId?: number, limit: number = 50): Promise<LoginAttempt[]> {
    const { db } = await import("./db.js");
    const { loginAttempts } = await import("../shared/schema.js");
    const { eq, desc } = await import("drizzle-orm");
    if (userId) {
      return db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.userId, userId))
        .orderBy(desc(loginAttempts.createdAt))
        .limit(limit);
    }
    return db
      .select()
      .from(loginAttempts)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(limit);
  }

  async getRecentFailedAttempts(email: string, minutes: number): Promise<number> {
    const { db } = await import("./db.js");
    const { loginAttempts } = await import("../shared/schema.js");
    const { eq, and, gte } = await import("drizzle-orm");
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const attempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, cutoff)
        )
      );
    return attempts.length;
  }

  async getRecentFailedAttemptsByIp(ipAddress: string, minutes: number): Promise<number> {
    const { db } = await import("./db.js");
    const { loginAttempts } = await import("../shared/schema.js");
    const { eq, and, gte } = await import("drizzle-orm");
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const attempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, cutoff)
        )
      );
    return attempts.length;
  }

  private userSettingsCache: UserSettings[] = [];
  private nextSettingsId = 1;

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const [announcement] = await db
      .insert(announcements)
      .values({
        type: data.type,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        active: data.active ?? true,
      })
      .returning();
    return announcement;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const { desc } = await import("drizzle-orm");
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const { eq, desc } = await import("drizzle-orm");
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.active, true))
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementById(id: number): Promise<Announcement | null> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || null;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement | null> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const [updated] = await db
      .update(announcements)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return updated || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const { db } = await import("./db.js");
    const { announcements } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  async getUserSettings(userId: number): Promise<UserSettings | null> {
    return this.userSettingsCache.find(s => s.userId === userId) || null;
  }

  async updateUserSettings(userId: number, data: Partial<{ churchName: string }>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const idx = this.userSettingsCache.findIndex(s => s.userId === userId);
      this.userSettingsCache[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      return this.userSettingsCache[idx];
    }
    const now = new Date();
    const settings: UserSettings = {
      id: this.nextSettingsId++,
      userId,
      churchName: data.churchName,
      createdAt: now,
      updatedAt: now,
    };
    this.userSettingsCache.push(settings);
    return settings;
  }

  private supportTicketsCache: SupportTicket[] = [];
  private nextTicketId = 1;

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const now = new Date();
    const ticket: SupportTicket = {
      id: this.nextTicketId++,
      ...data,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.supportTicketsCache.push(ticket);
    return ticket;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return [...this.supportTicketsCache].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | null> {
    return this.supportTicketsCache.find(t => t.id === id) || null;
  }

  async updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket | null> {
    const idx = this.supportTicketsCache.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const now = new Date();
    this.supportTicketsCache[idx] = {
      ...this.supportTicketsCache[idx],
      ...data,
      respondedAt: data.adminResponse ? now : this.supportTicketsCache[idx].respondedAt,
      updatedAt: now,
    };
    return this.supportTicketsCache[idx];
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    const idx = this.supportTicketsCache.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.supportTicketsCache.splice(idx, 1);
    return true;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    await this.ensureSystemSettingsTable();
    
    const { db } = await import("./db.js");
    const { systemSettings } = await import("../shared/schema.js");
    const [settings] = await db.select().from(systemSettings).limit(1);
    if (settings) {
      return settings;
    }
    const [newSettings] = await db.insert(systemSettings).values({}).returning();
    return newSettings;
  }

  async updateSystemSettings(data: UpdateSystemSettings): Promise<SystemSettings> {
    await this.ensureSystemSettingsTable();
    
    const { db } = await import("./db.js");
    const { systemSettings } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const existing = await this.getSystemSettings();
    const [updated] = await db
      .update(systemSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemSettings.id, existing.id))
      .returning();
    return updated;
  }
}

function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("Using database storage");
    return new DatabaseStorage();
  } else {
    console.log("DATABASE_URL not available, using file storage");
    return new FileStorage();
  }
}

export const storage: IStorage = createStorage();
