import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, Sparkles, UserCheck } from 'lucide-react';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isDefaultPassword: boolean) => void;
  isDefaultPassword?: boolean;
}

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDefaultPassword = true,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, customPass?: string) => {
    if (e) e.preventDefault();
    const passToTry = customPass !== undefined ? customPass : password;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passToTry }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Senha incorreta.');
      }

      localStorage.setItem('filadial_admin_auth', 'true');
      onSuccess(Boolean(data.isDefaultPassword));
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setPassword('admin123');
    handleSubmit(undefined, 'admin123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                Acesso do Administrador
              </h3>
              <p className="text-xs text-blue-100">
                Gerenciar operadores e monitorar a equipe ao vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Privilégios de Administrador:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              <li>Colocar os nomes das pessoas que estão trabalhando hoje</li>
              <li>Adicionar, renomear ou remover operadores da equipe</li>
              <li>Monitorar ligações, atendimentos e pausas em tempo real</li>
              <li>Intervir ou liberar ligações travadas se necessário</li>
            </ul>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Senha de Acesso de Administrador:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Digite sua senha..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isDefaultPassword ? (
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <span>Primeiro acesso (senha inicial):</span>
              <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                admin123
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Sua senha personalizada de administrador está ativa.</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'Verificando...' : 'Entrar como Administrador'}</span>
            </button>

            {isDefaultPassword && (
              <button
                type="button"
                onClick={handleQuickDemoAccess}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Primeiro Acesso: Entrar com "admin123"</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
