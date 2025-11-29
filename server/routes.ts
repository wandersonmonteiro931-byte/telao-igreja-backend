import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { LoginRequestSchema, RegisterRequestSchema, UpdateSystemSettingsSchema } from "../shared/schema.js";
import { storage } from "./storage.js";
import { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken, extractToken } from "./auth.js";

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

  // Create test announcement if none exist
  const existing = await storage.getActiveAnnouncements();
  if (existing.length === 0) {
    await storage.createAnnouncement({
      type: "text",
      title: "🎉 Bem-vindo!",
      content: "Este é um aviso de teste. Você pode criar seus próprios avisos no painel administrativo!",
      active: true,
    });
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

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
        return res.status(400).json({
          message: result.error.errors[0].message,
        });
      }

      const { identifier, password } = result.data;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const recentAttempts = await storage.getRecentFailedAttempts(identifier, RATE_LIMIT_WINDOW);
      if (recentAttempts >= MAX_ATTEMPTS_PER_WINDOW) {
        return res.status(429).json({
          message: `Muitas tentativas de login. Aguarde ${RATE_LIMIT_WINDOW} minutos.`,
          code: "RATE_LIMITED",
        });
      }

      const ipAttempts = await storage.getRecentFailedAttemptsByIp(ipAddress, RATE_LIMIT_WINDOW);
      if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
        return res.status(429).json({
          message: `Muitas tentativas deste endereço IP. Aguarde ${RATE_LIMIT_WINDOW} minutos.`,
          code: "IP_RATE_LIMITED",
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
          userAgent,
        });
        return res.status(403).json({
          message: "Conta bloqueada. Entre em contato com o administrador.",
          code: "ACCOUNT_BLOCKED",
        });
      }

      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutEnd = user.lastFailedAttempt
          ? new Date(user.lastFailedAttempt.getTime() + LOCKOUT_MINUTES * 60 * 1000)
          : new Date();
        
        if (new Date() < lockoutEnd) {
          const remainingMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
          return res.status(403).json({
            message: `Conta temporariamente bloqueada. Tente novamente em ${remainingMinutes} minutos.`,
            code: "TEMP_LOCKED",
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
          userAgent,
        });

        const attemptsLeft = MAX_FAILED_ATTEMPTS - (user.failedAttempts + 1);
        if (attemptsLeft > 0) {
          return res.status(401).json({
            message: `Credenciais inválidas. ${attemptsLeft} tentativas restantes.`,
          });
        } else {
          return res.status(401).json({
            message: "Credenciais inválidas. Conta temporariamente bloqueada.",
            code: "TEMP_LOCKED",
          });
        }
      }

      await storage.resetFailedAttempts(user.id);
      await storage.logLoginAttempt({
        userId: user.id,
        email: identifier,
        ipAddress,
        success: true,
        userAgent,
      });

      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        accessToken,
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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = RegisterRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.errors[0].message,
        });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Este email já está cadastrado" });
      }

      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Este nome de usuário já está em uso" });
      }

      const existingPhone = await storage.getUserByPhone(result.data.phone);
      if (existingPhone) {
        return res.status(409).json({ message: "Este número de telefone já está cadastrado" });
      }

      const user = await storage.addUser(
        result.data.email,
        result.data.username,
        result.data.phone,
        result.data.password,
        "user",
        {
          question1: result.data.securityQuestion1,
          answer1: result.data.securityAnswer1,
          question2: result.data.securityQuestion2,
          answer2: result.data.securityAnswer2,
          question3: result.data.securityQuestion3,
          answer3: result.data.securityAnswer3,
        }
      );

      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        accessToken,
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
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro ao registrar" });
    }
  });

  app.post("/api/auth/security-questions", async (req: Request, res: Response) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "Identificador é obrigatório" });
      }

      const localQuestions = await storage.getSecurityQuestions(identifier);
      if (localQuestions) {
        const questions = [localQuestions.question1, localQuestions.question2, localQuestions.question3];
        if (questions.some(q => q && q.length > 0)) {
          return res.json({ 
            questions,
            source: "local"
          });
        }
      }

      return res.status(404).json({ message: "Usuário não encontrado" });
    } catch (error) {
      console.error("Security questions error:", error);
      res.status(500).json({ message: "Erro ao buscar perguntas de segurança" });
    }
  });

  app.post("/api/auth/verify-security-answers", async (req: Request, res: Response) => {
    try {
      const { identifier, answer1, answer2, answer3 } = req.body;
      
      if (!identifier || !answer1 || !answer2 || !answer3) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const isValid = await storage.verifySecurityAnswers(user.id, answer1, answer2, answer3);
      if (!isValid) {
        return res.status(401).json({ message: "Respostas incorretas" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify security answers error:", error);
      res.status(500).json({ message: "Erro ao verificar respostas" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { identifier, answer1, answer2, answer3, newPassword, confirmNewPassword } = req.body;
      
      if (!identifier || !answer1 || !answer2 || !answer3 || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "As senhas não coincidem" });
      }

      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const isValid = await storage.verifySecurityAnswers(user.id, answer1, answer2, answer3);
      if (!isValid) {
        return res.status(401).json({ message: "Respostas incorretas" });
      }

      const success = await storage.updatePassword(user.id, newPassword);
      if (!success) {
        return res.status(500).json({ message: "Erro ao atualizar senha" });
      }

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token não fornecido" });
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ message: "Refresh token inválido ou expirado" });
      }

      const user = await storage.getUserById(payload.id);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: "Conta bloqueada" });
      }

      const accessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ message: "Erro ao renovar token" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: Request, res: Response) => {
    res.json({ message: "Desconectado com sucesso" });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Erro ao buscar dados do usuário" });
    }
  });

  app.post("/api/user/set-role", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { email, role } = req.body;

      if (!email || !role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: "Email e role válido são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email.trim());
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.updateUser(user.id, { role });
      
      res.json({ message: `Role atualizado para ${role}`, email, role });
    } catch (error) {
      console.error("Set role error:", error);
      res.status(500).json({ message: "Erro ao atualizar role" });
    }
  });

  app.get("/api/auth/verify", requireAuth, (req: AuthRequest, res: Response) => {
    res.json({
      valid: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        username: req.user?.username,
        role: req.user?.role,
      },
    });
  });

  app.post("/api/auth/get-user-role", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email.trim());
      
      if (!user) {
        return res.json({ role: null, found: false });
      }
      
      return res.json({ 
        role: user.role || 'user', 
        found: true,
        email: user.email,
        name: user.username
      });
    } catch (error) {
      console.error("Get user role error:", error);
      res.status(500).json({ message: "Erro ao buscar role do usuário" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          role: u.role,
          isBlocked: u.isBlocked,
          failedAttempts: u.failedAttempts,
          createdAt: new Date(u.createdAt).toISOString(),
          updatedAt: new Date(u.updatedAt).toISOString(),
        }))
      );
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/admin/login-attempts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const attempts = await storage.getLoginAttempts(undefined, limit);
      res.json(attempts.map((a) => ({
        ...a,
        createdAt: new Date(a.createdAt).toISOString(),
      })));
    } catch (error) {
      console.error("Get login attempts error:", error);
      res.status(500).json({ message: "Erro ao buscar logs de acesso" });
    }
  });

  app.post("/api/admin/users/:id/block", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.blockUser(id);
      res.json({ message: "Usuário bloqueado com sucesso" });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Erro ao bloquear usuário" });
    }
  });

  app.post("/api/admin/users/:id/unblock", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.unblockUser(id);
      res.json({ message: "Usuário desbloqueado com sucesso" });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ message: "Erro ao desbloquear usuário" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (deleted) {
        res.json({ message: "Usuário excluído com sucesso" });
      } else {
        res.status(404).json({ message: "Usuário não encontrado" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Ver detalhes completos de um usuário (admin)
  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const formatDate = (date: Date | string | null | undefined): string | null => {
        if (!date) return null;
        try {
          const d = date instanceof Date ? date : new Date(date);
          return d.toISOString();
        } catch {
          return null;
        }
      };
      
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
        failedAttempts: user.failedAttempts,
        lastFailedAttempt: formatDate(user.lastFailedAttempt),
        securityQuestion1: user.securityQuestion1,
        securityQuestion2: user.securityQuestion2,
        securityQuestion3: user.securityQuestion3,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do usuário" });
    }
  });

  // Editar dados do usuário (admin)
  app.put("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { email, username, phone, role, securityQuestion1, securityQuestion2, securityQuestion3 } = req.body;
      
      const existingUser = await storage.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verificar se email ou username já estão em uso por outro usuário
      if (email && email !== existingUser.email) {
        const emailCheck = await storage.getUserByEmail(email);
        if (emailCheck && emailCheck.id !== id) {
          return res.status(409).json({ message: "Este email já está em uso" });
        }
      }

      if (username && username !== existingUser.username) {
        const usernameCheck = await storage.getUserByUsername(username);
        if (usernameCheck && usernameCheck.id !== id) {
          return res.status(409).json({ message: "Este nome de usuário já está em uso" });
        }
      }

      const updates: any = {};
      if (email) updates.email = email;
      if (username) updates.username = username;
      if (phone !== undefined) updates.phone = phone;
      if (role && ['admin', 'user'].includes(role)) updates.role = role;
      if (securityQuestion1) updates.securityQuestion1 = securityQuestion1;
      if (securityQuestion2) updates.securityQuestion2 = securityQuestion2;
      if (securityQuestion3) updates.securityQuestion3 = securityQuestion3;

      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar usuário" });
      }

      res.json({
        message: "Usuário atualizado com sucesso",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          phone: updatedUser.phone,
          role: updatedUser.role,
          isBlocked: updatedUser.isBlocked,
          securityQuestion1: updatedUser.securityQuestion1,
          securityQuestion2: updatedUser.securityQuestion2,
          securityQuestion3: updatedUser.securityQuestion3,
          createdAt: new Date(updatedUser.createdAt).toISOString(),
          updatedAt: new Date(updatedUser.updatedAt).toISOString(),
        }
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Resetar senha do usuário (admin)
  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const success = await storage.updatePassword(id, newPassword);
      if (!success) {
        return res.status(500).json({ message: "Erro ao atualizar senha" });
      }

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro ao resetar senha" });
    }
  });

  // Ver logs de login/logout de um usuário específico (admin)
  app.get("/api/admin/users/:id/login-attempts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 100;
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const attempts = await storage.getLoginAttempts(id, limit);
      res.json(attempts.map((a) => ({
        ...a,
        createdAt: new Date(a.createdAt).toISOString(),
      })));
    } catch (error) {
      console.error("Get user login attempts error:", error);
      res.status(500).json({ message: "Erro ao buscar logs de acesso do usuário" });
    }
  });

  // Criar novo administrador (admin)
  app.post("/api/admin/create-admin", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { email, username, phone, password, securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2, securityQuestion3, securityAnswer3 } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, nome de usuário e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verificar se email já existe
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Este email já está cadastrado" });
      }

      // Verificar se username já existe
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: "Este nome de usuário já está em uso" });
      }

      // Verificar se phone já existe (se fornecido)
      if (phone) {
        const existingPhone = await storage.getUserByPhone(phone);
        if (existingPhone) {
          return res.status(409).json({ message: "Este telefone já está cadastrado" });
        }
      }

      const user = await storage.addUser(
        email,
        username,
        phone || "",
        password,
        "admin",
        {
          question1: securityQuestion1 || "Qual é o nome do seu primeiro pet?",
          answer1: securityAnswer1 || "admin",
          question2: securityQuestion2 || "Em que cidade você nasceu?",
          answer2: securityAnswer2 || "admin",
          question3: securityQuestion3 || "Qual é o nome da sua mãe?",
          answer3: securityAnswer3 || "admin",
        }
      );

      res.status(201).json({
        message: "Administrador criado com sucesso",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        }
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Erro ao criar administrador" });
    }
  });

  app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Erro ao buscar perfil" });
    }
  });

  app.post("/api/admin/announcements", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type, title, content, imageUrl, videoUrl, active } = req.body;
      if (!type || !title || !content) {
        return res.status(400).json({ message: "Tipo, título e conteúdo são obrigatórios" });
      }
      const announcement = await storage.createAnnouncement({
        type,
        title,
        content,
        imageUrl,
        videoUrl,
        active: active ?? true,
      });
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(500).json({ message: "Erro ao criar anúncio" });
    }
  });

  app.get("/api/admin/announcements", requireAdmin, async (req: Request, res: Response) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ message: "Erro ao buscar anúncios" });
    }
  });

  app.get("/api/announcements", async (_req: Request, res: Response) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Get active announcements error:", error);
      res.status(500).json({ message: "Erro ao buscar anúncios" });
    }
  });

  app.put("/api/admin/announcements/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { type, title, content, imageUrl, videoUrl, active } = req.body;
      const announcement = await storage.updateAnnouncement(id, {
        type,
        title,
        content,
        imageUrl,
        videoUrl,
        active,
      });
      if (!announcement) {
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }
      res.json(announcement);
    } catch (error) {
      console.error("Update announcement error:", error);
      res.status(500).json({ message: "Erro ao atualizar anúncio" });
    }
  });

  app.delete("/api/admin/announcements/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }
      res.json({ message: "Anúncio excluído com sucesso" });
    } catch (error) {
      console.error("Delete announcement error:", error);
      res.status(500).json({ message: "Erro ao excluir anúncio" });
    }
  });

  app.get("/api/user/settings", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      const settings = await storage.getUserSettings(req.user.id);
      res.json(settings || { churchName: "" });
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put("/api/user/settings", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      const { churchName } = req.body;
      const settings = await storage.updateUserSettings(req.user.id, { churchName });
      res.json(settings);
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  app.post("/api/support", async (req: Request, res: Response) => {
    try {
      const { username, email, phone, subject, message } = req.body;
      
      if (!username || !email || !subject || !message) {
        return res.status(400).json({ message: "Campos obrigatórios: nome, email, assunto e mensagem" });
      }
      
      const ticket = await storage.createSupportTicket({
        username,
        email,
        phone: phone || "",
        subject,
        message,
      });
      
      res.status(201).json({ message: "Mensagem enviada com sucesso", ticket });
    } catch (error) {
      console.error("Create support ticket error:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem de suporte" });
    }
  });

  app.get("/api/admin/support", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Get support tickets error:", error);
      res.status(500).json({ message: "Erro ao buscar tickets de suporte" });
    }
  });

  app.get("/api/admin/support/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getSupportTicketById(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket não encontrado" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Get support ticket error:", error);
      res.status(500).json({ message: "Erro ao buscar ticket de suporte" });
    }
  });

  app.put("/api/admin/support/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, adminResponse } = req.body;
      
      const ticket = await storage.updateSupportTicket(id, {
        status,
        adminResponse,
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket não encontrado" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Update support ticket error:", error);
      res.status(500).json({ message: "Erro ao atualizar ticket de suporte" });
    }
  });

  app.delete("/api/admin/support/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSupportTicket(id);
      if (!deleted) {
        return res.status(404).json({ message: "Ticket não encontrado" });
      }
      res.json({ message: "Ticket excluído com sucesso" });
    } catch (error) {
      console.error("Delete support ticket error:", error);
      res.status(500).json({ message: "Erro ao excluir ticket de suporte" });
    }
  });

  app.get("/api/system-settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get system settings error:", error);
      res.status(500).json({ message: "Erro ao buscar configurações do sistema" });
    }
  });

  app.put("/api/admin/system-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = UpdateSystemSettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
      
      const settings = await storage.updateSystemSettings(result.data);
      
      res.json(settings);
    } catch (error) {
      console.error("Update system settings error:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações do sistema" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
