import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, Phone, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { register as apiRegister, getStoredUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECURITY_QUESTIONS = [
  "Qual o nome do seu primeiro animal de estimação?",
  "Qual o nome da sua primeira escola?",
  "Qual a cidade onde você nasceu?",
  "Qual o nome do seu melhor amigo de infância?",
  "Qual o modelo do seu primeiro carro?",
  "Qual o nome da sua mãe?",
  "Qual sua comida favorita?",
  "Qual o nome do seu time de futebol favorito?",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [pergunta1, setPergunta1] = useState("");
  const [resposta1, setResposta1] = useState("");
  const [pergunta2, setPergunta2] = useState("");
  const [resposta2, setResposta2] = useState("");
  const [pergunta3, setPergunta3] = useState("");
  const [resposta3, setResposta3] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/user/home");
    }
  }, [user, authLoading, setLocation]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!username.trim()) {
      setErro("Por favor, digite um nome de usuário.");
      return;
    }

    if (senha !== senhaConfirm) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!pergunta1 || !resposta1 || !pergunta2 || !resposta2 || !pergunta3 || !resposta3) {
      setErro("Por favor, preencha todas as perguntas e respostas de segurança.");
      return;
    }

    if (pergunta1 === pergunta2 || pergunta1 === pergunta3 || pergunta2 === pergunta3) {
      setErro("Selecione perguntas de segurança diferentes.");
      return;
    }

    setLoading(true);

    try {
      const result = await apiRegister({
        email: email.trim(),
        username: username.trim(),
        phone: telefone,
        password: senha,
        role: 'user',
        securityQuestions: {
          question1: pergunta1,
          answer1: resposta1.toLowerCase().trim(),
          question2: pergunta2,
          answer2: resposta2.toLowerCase().trim(),
          question3: pergunta3,
          answer3: resposta3.toLowerCase().trim(),
        },
      });

      if (!result.success) {
        setErro(result.error || "Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setLocation("/user/home");
    } catch (error: any) {
      console.error(error);
      setErro("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuestions = (excludeQuestions: string[]) => {
    return SECURITY_QUESTIONS.filter(q => !excludeQuestions.includes(q));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 p-4 rounded-full border-2 border-purple-600">
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-slate-400">Preencha os dados abaixo para se cadastrar</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome de Usuário *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={handlePhoneChange}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="Digite a senha novamente"
                value={senhaConfirm}
                onChange={(e) => setSenhaConfirm(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                data-testid="input-password-confirm"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300"
              >
                {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-slate-300">Perguntas de Segurança</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Essas perguntas serão usadas para recuperar sua senha caso você a esqueça.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pergunta 1 *</label>
                <Select value={pergunta1} onValueChange={setPergunta1}>
                  <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione uma pergunta" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {getAvailableQuestions([pergunta2, pergunta3]).map((q) => (
                      <SelectItem key={q} value={q} className="text-white hover:bg-slate-800">
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Sua resposta"
                  value={resposta1}
                  onChange={(e) => setResposta1(e.target.value)}
                  disabled={loading}
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                  data-testid="input-answer-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pergunta 2 *</label>
                <Select value={pergunta2} onValueChange={setPergunta2}>
                  <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione uma pergunta" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {getAvailableQuestions([pergunta1, pergunta3]).map((q) => (
                      <SelectItem key={q} value={q} className="text-white hover:bg-slate-800">
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Sua resposta"
                  value={resposta2}
                  onChange={(e) => setResposta2(e.target.value)}
                  disabled={loading}
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                  data-testid="input-answer-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pergunta 3 *</label>
                <Select value={pergunta3} onValueChange={setPergunta3}>
                  <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione uma pergunta" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {getAvailableQuestions([pergunta1, pergunta2]).map((q) => (
                      <SelectItem key={q} value={q} className="text-white hover:bg-slate-800">
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Sua resposta"
                  value={resposta3}
                  onChange={(e) => setResposta3(e.target.value)}
                  disabled={loading}
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                  data-testid="input-answer-3"
                />
              </div>
            </div>
          </div>

          {erro && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-400">{erro}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition h-12 mt-6"
            data-testid="button-register"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? "Criando..." : "Criar Conta"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Já tem uma conta?{" "}
            <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
              Faça login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
