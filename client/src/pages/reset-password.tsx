import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface RecoveryUser {
  email: string;
  questions: string[];
  answers: string[];
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();

  const [user, setUser] = useState<RecoveryUser | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("recoveryUser");

    if (!saved) {
      setLocation("/forgot-password");
      return;
    }

    const parsedUser = JSON.parse(saved);
    if (!parsedUser.answers || parsedUser.answers.length < 3) {
      setLocation("/security-questions");
      return;
    }

    setUser(parsedUser);
  }, [setLocation]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!user) return;

    try {
      setLoading(true);

      const response = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          identifier: user.email,
          answer1: user.answers[0],
          answer2: user.answers[1],
          answer3: user.answers[2],
          newPassword: password,
          confirmNewPassword: confirm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Erro ao redefinir senha.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("recoveryUser");
      setSuccess("Senha alterada com sucesso! Redirecionando...");
      
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar a senha.");
    }

    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 p-4 rounded-full border-2 border-purple-600">
              <Lock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Criar Nova Senha</h1>
          <p className="text-slate-400">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!success}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading || !!success}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-confirm-password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition h-12"
            data-testid="button-save"
          >
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/security-questions" 
            className="text-purple-400 hover:text-purple-300 font-medium transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </a>
        </div>
      </div>
    </div>
  );
}
