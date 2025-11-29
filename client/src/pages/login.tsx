import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { login as apiLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role) {
      if (user.role === 'admin') {
        setLocation("/admin-dashboard");
      } else {
        setLocation("/user/home");
      }
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    
    if (savedEmail && savedPassword) {
      setIdentifier(savedEmail);
      setSenha(savedPassword);
      setLembrarMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const result = await apiLogin({
        identifier: identifier.trim(),
        password: senha,
      });

      if (!result.success) {
        setErro(result.error || "Erro ao fazer login. Tente novamente.");
        setLoading(false);
        return;
      }

      if (lembrarMe) {
        localStorage.setItem("rememberedEmail", identifier.trim());
        localStorage.setItem("rememberedPassword", senha);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      await refreshUser();

    } catch (error: any) {
      console.error(error);
      setErro("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 p-4 rounded-full border-2 border-purple-600">
              <LogIn className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo</h1>
          <p className="text-slate-400">Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email ou Nome de Usuário
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="seu@email.com ou username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-email"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Senha
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              checked={lembrarMe}
              onCheckedChange={setLembrarMe}
              disabled={loading}
              className="data-[state=checked]:bg-purple-600"
            />
            <label className="text-sm text-slate-400 cursor-pointer">
              Lembrar-me
            </label>
          </div>

          {erro && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-400">{erro}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition h-12"
            data-testid="button-login"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Não tem uma conta?{" "}
            <a href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
              Cadastre-se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export { Login };
