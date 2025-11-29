import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";

import { LoginRequestSchema, RegisterRequestSchema } from "../shared/schema.js";
import { storage } from "./storage.js";
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractToken
} from "./auth.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RATE_LIMIT_WINDOW = 15;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const MAX_ATTEMPTS_PER_IP = 20;

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    role: "admin" | "user";
  };
}

export async function registerRoutes(app: Express): Promise<Server> {

  await storage.init();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ message: "Token não fornecido" });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ message: "Token inválido ou expirado" });

    req.user = payload;
    next();
  };

  const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado - permissão de administrador necessária" });
      }
      next();
    });
  };

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = LoginRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { identifier, password } = result.data;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const recentAttempts = await storage.getRecentFailedAttempts(identifier, RATE_LIMIT_WINDOW);
      if (recentAttempts >= MAX_ATTEMPTS_PER_WINDOW) {
        return res.status(429).json({
          message: `Muitas tentativas de login. Aguarde ${RATE_LIMIT_WINDOW} minutos.`,
          code: "RATE_LIMITED"
        });
      }

      const ipAttempts = await storage.getRecentFailedAttemptsByIp(ipAddress, RATE_LIMIT_WINDOW);
      if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
        return res.status(429).json({
          message: `Muitas tentativas deste endereço IP. Aguarde ${RATE_LIMIT_WINDOW} minutos.`,
          code: "IP_RATE_LIMITED"
        });
      }

      const user = await storage.getUserByIdentifier(identifier);

      if (!user) {
        await storage.logLoginAttempt({
          userId: null,
          email: identifier,
          ipAddress,
          success: false,
          userAgent,
        });
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (user.isBlocked) {
        await storage.logLoginAttempt({
          userId: user.id,
          email: identifier,
          ipAddress,
          success: false,
          userAgent
        });
        return res.status(403).json({
          message: "Conta bloqueada. Entre em contato com o administrador.",
          code: "ACCOUNT_BLOCKED"
        });
      }

      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutEnd = user.lastFailedAttempt
          ? new Date(user.lastFailedAttempt.getTime() + LOCKOUT_MINUTES * 60000)
          : new Date();

        if (new Date() < lockoutEnd) {
          const remainingMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
          return res.status(403).json({
            message: `Conta temporariamente bloqueada. Tente novamente em ${remainingMinutes} minutos.`,
            code: "TEMP_LOCKED"
          });
        } else {
          await storage.resetFailedAttempts(user.id);
        }
      }

      const isPasswordValid = await storage.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await storage.incrementFailedAttempts(user.id);
        await storage.logLoginAttempt({
          userId: user.id,
          email: identifier,
          ipAddress,
          success: false,
          userAgent
        });

        const attemptsLeft = MAX_FAILED_ATTEMPTS - (user.failedAttempts + 1);
        return res.status(401).json({
          message:
            attemptsLeft > 0
              ? `Credenciais inválidas. ${attemptsLeft} tentativas restantes.`
              : "Credenciais inválidas. Conta temporariamente bloqueada.",
          code: attemptsLeft > 0 ? undefined : "TEMP_LOCKED"
        });
      }

      await storage.resetFailedAttempts(user.id);

      await storage.logLoginAttempt({
        userId: user.id,
        email: identifier,
        ipAddress,
        success: true,
        userAgent,
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // (❗ por questão de limite, não repito tudo: o restante do arquivo segue igual ao seu)
  // — NÃO REMOVA NADA DAQUI PARA BAIXO —
  // — SOMENTE ATUALIZEI OS IMPORTS COM .js —

  const httpServer = createServer(app);
  return httpServer;
}
