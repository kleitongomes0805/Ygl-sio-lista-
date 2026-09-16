import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles } from 'lucide-react';

interface ChangeAdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPassword: string) => void;
  isFirstAccess?: boolean;
}

export const ChangeAdminPasswordModal: React.FC<ChangeAdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isFirstAccess = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Por favor, informe a senha atual.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação não coincide com a nova senha.');
      return;
    }

    if (newPassword === 'admin123' && isFirstAccess) {
      setError('Por favor, escolha uma senha diferente da padrão "admin123".');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao alterar a senha.');
      }

      onSuccess(newPassword.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar alteração de senha';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {isFirstAccess ? 'Primeiro Acesso: Definir Nova Senha' : 'Alterar Senha do Administrador'}
              </h3>
              <p className="text-xs text-amber-100">
                {isFirstAccess
                  ? 'Substitua a senha provisória admin123 por uma de sua preferência'
                  : 'Atualize as credenciais de acesso seguro do painel'}
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

        {/* First Access Warning Banner */}
        {isFirstAccess && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-6 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Primeiro Acesso Detectado:</strong> Para a segurança da sua equipe, defina uma nova senha para substituir <code>admin123</code>.
            </span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Senha Atual:
              </label>
              {isFirstAccess && (
                <button
                  type="button"
                  onClick={() => setCurrentPassword('admin123')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                >
                  Preencher "admin123"
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                placeholder={isFirstAccess ? 'Digite admin123...' : 'Digite sua senha atual...'}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nova Senha de Administrador:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Mínimo de 4 caracteres..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 4 && (
              <span className="text-[10px] text-red-500 mt-1 block">
                Muito curta (mínimo de 4 dígitos)
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Confirmar Nova Senha:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Repita a nova senha..."
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 ${
                  confirmPassword && isMatching
                    ? 'border-emerald-500 focus:ring-emerald-500/20'
                    : confirmPassword && !isMatching
                      ? 'border-red-400 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-amber-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && isMatching && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                As senhas coincidem!
              </span>
            )}
            {confirmPassword && !isMatching && (
              <span className="text-[10px] text-red-500 mt-1 block">
                As senhas não coincidem.
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Salvando...' : 'Confirmar e Salvar Nova Senha'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              {isFirstAccess ? 'Lembrar de alterar mais tarde' : 'Cancelar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
