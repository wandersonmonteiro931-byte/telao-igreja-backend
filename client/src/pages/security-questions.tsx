import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    localStorage.setItem(
      "recoveryUser",
      JSON.stringify({
        ...recoveryUser,
        answers: answers,
      }),
    );

    setLocation("/reset-password");
    setIsLoading(false);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

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

        {questions.length > 0 ? (
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
                <p className="text-sm text-red-400">{error}</p>
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
