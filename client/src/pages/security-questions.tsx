import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface RecoveryUser {
  email: string;
  questions: string[];
}

export default function SecurityQuestions() {
  const [, setLocation] = useLocation();

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoveryUser, setRecoveryUser] = useState<RecoveryUser | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("recoveryUser");
    if (!storedUser) {
      setLocation("/forgot-password");
      return;
    }

    try {
      const user: RecoveryUser = JSON.parse(storedUser);
      setRecoveryUser(user);
      
      if (user.questions && Array.isArray(user.questions)) {
        setQuestions(user.questions);
      } else {
        setError("Este usuário não possui perguntas de segurança cadastradas.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar perguntas de segurança.");
    }
  }, [setLocation]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!recoveryUser) {
      setError("Sessão expirada. Tente novamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/auth/verify-security-answers", {
        method: "POST",
        body: JSON.stringify({
          identifier: recoveryUser.email,
          answer1: answers[0],
          answer2: answers[1],
          answer3: answers[2],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "RECOVERY_BLOCKED") {
          setIsBlocked(true);
          setError(data.message);
          localStorage.removeItem("recoveryUser");
        } else if (data.code === "INCORRECT_ANSWERS") {
          setAttemptsRemaining(data.attemptsRemaining);
          setError(data.message);
        } else {
          setError(data.message || "Erro ao verificar respostas");
        }
        setIsLoading(false);
        return;
      }

      localStorage.setItem(
        "recoveryUser",
        JSON.stringify({
          ...recoveryUser,
          answers: answers,
          verified: true,
        }),
      );

      setLocation("/reset-password");
    } catch (err) {
      console.error(err);
      setError("Erro ao verificar respostas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-600/20 p-4 rounded-full border-2 border-red-600">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Conta Bloqueada</h1>
            <p className="text-slate-400">Recuperação de senha temporariamente bloqueada</p>
          </div>

          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-6">
            <p className="text-red-400 text-center mb-4">
              Você excedeu o número máximo de tentativas para responder às perguntas de segurança.
            </p>
            <p className="text-slate-400 text-center text-sm">
              Para desbloquear sua conta e redefinir sua senha, entre em contato com o suporte através da página de contato.
            </p>
          </div>

          <div className="space-y-3">
            <a 
              href="/support" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              data-testid="link-support"
            >
              Falar com Suporte
            </a>
            <a 
              href="/" 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Voltar para o Início
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 p-4 rounded-full border-2 border-purple-600">
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Perguntas de Segurança</h1>
          <p className="text-slate-400">Responda às perguntas para verificar sua identidade</p>
        </div>

        {questions.length > 0 && !isBlocked ? (
          <form onSubmit={handleVerify} className="space-y-4">
            {questions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {question}
                </label>
                <input
                  type="text"
                  placeholder="Sua resposta"
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                  data-testid={`input-answer-${index}`}
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400">{error}</p>
                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <p className="text-xs text-red-400/70 mt-1">
                        Atenção: Após 3 tentativas incorretas, sua conta será bloqueada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition h-12"
              data-testid="button-verify"
            >
              {isLoading ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            {error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Carregando perguntas...
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/forgot-password" 
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
