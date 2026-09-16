import React, { useState, useEffect } from 'react';
import {
  Building2,
  KeyRound,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  PhoneCall,
  Clock,
  Briefcase,
  Hash,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  LogOut,
  X,
} from 'lucide-react';
import { Agent, WorkgroupConfig } from '../types';

interface WorkgroupLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  currentAgentId: string;
  onSelectAgent: (agentId: string) => void;
  savedWorkgroup?: WorkgroupConfig | null;
  onWorkgroupAuthenticated: (workgroup: { name: string; clientName: string; description?: string }) => void;
  canDismiss?: boolean;
}

export const WorkgroupLoginModal: React.FC<WorkgroupLoginModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentAgentId,
  onSelectAgent,
  savedWorkgroup,
  onWorkgroupAuthenticated,
  canDismiss = true,
}) => {
  // Step: 'credentials' | 'select_profile'
  const [step, setStep] = useState<'credentials' | 'select_profile'>('credentials');
  const [groupName, setGroupName] = useState<string>('');
  const [groupPassword, setGroupPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [authenticatedGroup, setAuthenticatedGroup] = useState<{
    name: string;
    clientName: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      // If already authenticated in a workgroup, start on profile selection step
      if (savedWorkgroup && savedWorkgroup.name) {
        setAuthenticatedGroup(savedWorkgroup);
        setGroupName(savedWorkgroup.name);
        setStep('select_profile');
      } else {
        setStep('credentials');
        setGroupName('');
        setGroupPassword('');
      }
    }
  }, [isOpen, savedWorkgroup]);

  if (!isOpen) return null;

  const handleGroupLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Por favor, informe o Nome do Grupo de Trabalho.');
      return;
    }
    if (!groupPassword.trim()) {
      setError('Por favor, informe a Senha do Grupo.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/workgroup/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: groupName.trim(),
          groupPassword: groupPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Nome do grupo ou senha incorretos.');
      } else {
        setAuthenticatedGroup(data.workgroup);
        onWorkgroupAuthenticated(data.workgroup);
        setStep('select_profile');
      }
    } catch (err: any) {
      setError('Erro ao conectar com o servidor: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (agentId: string) => {
    onSelectAgent(agentId);
    onClose();
  };

  const handleQuickFillDemo = () => {
    setGroupName('Equipe Comercial Matriz');
    setGroupPassword('grupo123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Dismiss button (only if operator already had a profile or can dismiss) */}
        {canDismiss && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {step === 'credentials' ? (
          <div>
            {/* Header Credentials Step */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Entrar no Grupo de Trabalho
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5">
                Digite o <strong>Nome do Grupo</strong> e a <strong>Senha do Grupo</strong> fornecidos pelo seu Administrador para acessar a fila e encontrar seu perfil.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">Acesso não autorizado:</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGroupLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Nome do Grupo de Trabalho:
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Equipe Comercial Matriz"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    Senha do Grupo:
                  </span>
                  <span className="text-[10px] text-slate-400">Fornecida pelo Admin</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder="Digite a senha do grupo"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  <span>{isLoading ? 'Localizando Grupo...' : 'Acessar Grupo de Trabalho'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Demo Helper */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                Ambiente de demonstração?
              </span>
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Preencher Grupo & Senha Padrão</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Select Profile Step */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Grupo Conectado: {authenticatedGroup?.name || 'Equipe Comercial'}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Encontre seu Perfil para Trabalhar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Selecione seu nome na lista abaixo para entrar no discador com seu perfil de operador:
              </p>
            </div>

            {/* Operators List in this Workgroup */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {agents.map((ag) => {
                const isCurrent = currentAgentId === ag.id;
                const shiftLabels: Record<string, string> = {
                  manha: 'Manhã',
                  tarde: 'Tarde',
                  noite: 'Noite',
                  integral: 'Integral',
                };

                return (
                  <div
                    key={ag.id}
                    onClick={() => handleSelectProfile(ag.id)}
                    className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                        style={{ backgroundColor: ag.color || '#3B82F6' }}
                      >
                        {ag.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {ag.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white leading-none">
                              Ativo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {ag.role && (
                            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {ag.role}
                            </span>
                          )}
                          {ag.extension && (
                            <span className="flex items-center gap-1 font-mono">
                              <Hash className="w-3 h-3 text-slate-400" />
                              Ramal {ag.extension}
                            </span>
                          )}
                          {ag.shift && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {shiftLabels[ag.shift] || ag.shift}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-emerald-600 group-hover:text-white border border-slate-200 dark:border-slate-600 group-hover:border-emerald-600'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Entrar' : 'Sou Eu'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Switch Group or Ask Admin */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Trocar de Grupo</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Não encontrou seu perfil? Peça ao Admin para cadastrá-lo.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
