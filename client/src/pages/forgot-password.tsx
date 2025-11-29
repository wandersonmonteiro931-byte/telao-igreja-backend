import { useState } from "react";
import { useLocation } from "wouter";
import { Key, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setError("Por favor, insira seu email.");
        setIsLoading(false);
        return;
      }

      const response = await apiRequest("/api/auth/security-questions", {
        method: "POST",
        body: JSON.stringify({ identifier: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Email não encontrado.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      localStorage.setItem(
        "recoveryUser",
        JSON.stringify({
          email: email.trim(),
          questions: data.questions,
        }),
      );

      setLocation("/security-questions");
    } catch (err) {
      console.error(err);
      setError("Erro ao processar solicitação.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 p-4 rounded-full border-2 border-purple-600">
              <Key className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
          <p className="text-slate-400">Informe seu email cadastrado</p>
        </div>

        <form onSubmit={handleFindUser} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition h-12"
            data-testid="button-continue"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Buscando..." : "Continuar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="text-purple-400 hover:text-purple-300 font-medium transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </a>
        </div>
      </div>
    </div>
  );
}
