import React, { useState, useEffect } from 'react';
import {
  Users,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  PhoneForwarded,
  Shield,
  ShieldCheck,
  Activity,
  History,
  Building,
  MessageCircle,
  UserPlus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  PhoneOff,
  KeyRound,
  ShieldAlert,
  Target,
  Briefcase,
  RotateCcw,
  LayoutGrid,
  List,
  Phone,
  Building2,
  Copy,
  Check,
  Share2,
  EyeOff,
} from 'lucide-react';
import { Contact, Agent, QueueStats, ActivityLog, ContactStatus, AgentStatus, WorkgroupConfig } from '../types';
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatTimeAgo,
  formatSecondsToTimer,
} from '../utils/formatters';
import { OperatorModal, AgentFormData } from './OperatorModal';

interface AdminDashboardProps {
  stats: QueueStats;
  agents: Agent[];
  contacts: Contact[];
  logs: ActivityLog[];
  onSelectContact: (contact: Contact) => void;
  onResetContactToPending: (contactId: string) => void;
  onSelectAgent: (agentId: string) => void;
  isAdminAuthenticated: boolean;
  onOpenAdminAccess: () => void;
  onLockAdminSession: () => void;
  onSaveAgent: (agentData: AgentFormData) => Promise<void>;
  onDeleteAgent: (agentId: string) => Promise<void>;
  onUpdateAgentStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  onForceReleaseContact: (contactId: string) => Promise<void>;
  onResetAgentMetrics?: (agentId: string) => Promise<void>;
  isDefaultPassword?: boolean;
  onOpenChangePassword: () => void;
  currentWorkgroup?: WorkgroupConfig;
  onOpenWorkgroupConfig?: () => void;
}


// Live timer for active calls
const LiveCallTimer: React.FC<{ startTime?: number | null }> = ({ startTime }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
      {formatSecondsToTimer(seconds)}
    </span>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  agents,
  contacts,
  logs,
  onSelectContact,
  onResetContactToPending,
  onSelectAgent,
  isAdminAuthenticated,
  onOpenAdminAccess,
  onLockAdminSession,
  onSaveAgent,
  onDeleteAgent,
  onUpdateAgentStatus,
  onForceReleaseContact,
  onResetAgentMetrics,
  isDefaultPassword = true,
  onOpenChangePassword,
  currentWorkgroup,
  onOpenWorkgroupConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentStatusFilter, setAgentStatusFilter] = useState<string>('all');
  const [agentViewMode, setAgentViewMode] = useState<'cards' | 'table'>('cards');

  // Workgroup password visibility and copy feedback
  const [showGroupPass, setShowGroupPass] = useState(false);
  const [groupAccessCopied, setGroupAccessCopied] = useState(false);

  const handleCopyGroupAccess = () => {
    const group = currentWorkgroup?.name || 'Equipe Comercial Matriz';
    const pass = currentWorkgroup?.password || 'grupo123';
    const text = `🏢 *ACESSO À EQUIPE DE ATENDIMENTO - FILADIAL* 📞\n\n` +
      `Olá equipe! Ao abrir o aplicativo FilaDial, informem os dados abaixo para acessar a fila e encontrar seu perfil de trabalho:\n\n` +
      `🏢 *Grupo de Trabalho:* ${group}\n` +
      `🔑 *Senha do Grupo:* ${pass}\n\n` +
      `👉 *Passo a passo:*\n` +
      `1. Abra o app FilaDial no navegador ou celular.\n` +
      `2. Digite o Nome do Grupo e a Senha acima.\n` +
      `3. Selecione seu Perfil para começar a atender os contatos da fila!`;

    navigator.clipboard.writeText(text);
    setGroupAccessCopied(true);
    setTimeout(() => setGroupAccessCopied(false), 3500);
  };

  // Operator modal state
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Quick inline login state if not authenticated
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineLoading, setInlineLoading] = useState(false);

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  // Calculate live agents
  const activeDialersCount = agents.filter((a) => a.status === 'in_call').length;
  const availableCount = agents.filter((a) => a.status === 'available').length;
  const pausedCount = agents.filter((a) => a.status === 'paused').length;

  const filteredAgents = agents.filter((a) => {
    if (agentStatusFilter === 'all') return true;
    return a.status === agentStatusFilter;
  });

  const handleOpenAddOperator = () => {
    setEditingAgent(null);
    setIsOperatorModalOpen(true);
  };

  const handleOpenEditOperator = (agent: Agent) => {
    setEditingAgent(agent);
    setIsOperatorModalOpen(true);
  };

  const handleInlineLogin = async (e?: React.FormEvent, customPass?: string) => {
    if (e) e.preventDefault();
    const pass = customPass !== undefined ? customPass : inlinePassword;
    setInlineLoading(true);
    setInlineError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Senha incorreta');
      }
      localStorage.setItem('filadial_admin_auth', 'true');
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setInlineError(msg);
    } finally {
      setInlineLoading(false);
    }
  };

  // If user has not authenticated as Admin, show Admin Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Acesso Restrito ao Administrador
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Esta área permite colocar os nomes das pessoas que estão trabalhando na operação, gerenciar a equipe e monitorar todas as ligações em tempo real.
            </p>
          </div>

          <form onSubmit={handleInlineLogin} className="space-y-4 max-w-sm mx-auto text-left">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Senha de Administrador:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inlinePassword}
                  onChange={(e) => {
                    setInlinePassword(e.target.value);
                    setInlineError(null);
                  }}
                  placeholder="Digite sua senha..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
            </div>

            {inlineError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inlineError}</span>
              </div>
            )}

            {isDefaultPassword ? (
              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <span>Primeiro acesso (senha padrão):</span>
                <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                  admin123
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Senha personalizada de administrador configurada.</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={inlineLoading || !inlinePassword}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Unlock className="w-4 h-4" />
                <span>{inlineLoading ? 'Autenticando...' : 'Liberar Acesso Admin'}</span>
              </button>

              {isDefaultPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setInlinePassword('admin123');
                    handleInlineLogin(undefined, 'admin123');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
  }

  return (
    <div className="space-y-6">
      {/* First Access Password Change Banner */}
      {isDefaultPassword && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
                Aviso de Segurança: Você está utilizando a senha padrão de primeiro acesso (admin123)
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Recomendamos definir uma senha pessoal agora para garantir o controle exclusivo da sua equipe.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenChangePassword}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Alterar Senha do Admin</span>
          </button>
        </div>
      )}

      {/* Top Admin Controls & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Painel do Administrador & Monitoramento
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coloque os nomes das pessoas que estão trabalhando e acompanhe em tempo real quem está ligando
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={onOpenChangePassword}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDefaultPassword
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}
            title="Alterar senha do administrador"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Alterar Senha</span>
            {isDefaultPassword && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={handleOpenAddOperator}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Cadastrar Atendente</span>
          </button>

          <button
            onClick={onLockAdminSession}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Bloquear sessão do administrador"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear Painel</span>
          </button>
        </div>
      </div>

      {/* Workgroup & Client Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-blue-800/80 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-blue-300 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Grupo de Trabalho da Operação
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {agents.length} Atendentes Cadastrados
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{currentWorkgroup?.name || 'Equipe Comercial Matriz'}</span>
                {currentWorkgroup?.clientName && (
                  <span className="text-xs font-normal text-blue-200">
                    ({currentWorkgroup.clientName})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Os operadores usam o nome do grupo e a senha abaixo ao abrir o app para encontrar seus perfis.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Password Display Box */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-slate-300 font-sans">Senha do Grupo:</span>
                <span className="font-bold text-white tracking-wider">
                  {showGroupPass ? (currentWorkgroup?.password || 'grupo123') : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupPass(!showGroupPass)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showGroupPass ? 'Ocultar senha' : 'Ver senha'}
              >
                {showGroupPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Copy access for operators */}
            <button
              type="button"
              onClick={handleCopyGroupAccess}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
              title="Copiar mensagem formatada com grupo e senha para enviar no WhatsApp da equipe"
            >
              {groupAccessCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copiar Acesso Atendentes</span>
                </>
              )}
            </button>

            {/* Configure Client & Workgroup button */}
            {onOpenWorkgroupConfig && (
              <button
                type="button"
                onClick={onOpenWorkgroupConfig}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Configurar Grupo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total de Leads</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {stats.total}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Base na fila</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Aguardando na Fila</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">
            {stats.pending}
          </span>
          <span className="text-[10px] text-blue-500 mt-1 block">Prontos para puxar</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
            Em Atendimento Agora
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono">
              {stats.inProgress}
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <span className="text-[10px] text-amber-600/80 mt-1 block">
            {activeDialersCount} operadores falando
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Finalizados</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono mt-1 block">
            {stats.completed}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Chamadas concluídas</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-teal-200 dark:border-teal-800 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 block">
            WhatsApps Enviados
          </span>
          <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1 block">
            {stats.whatsappCount}
          </span>
          <span className="text-[10px] text-teal-500 mt-1 block">Mensagens rápidas</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
            Taxa de Sucesso
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {stats.conversionRate}%
          </span>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">
            {stats.answeredCount} qualificados
          </span>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DE ATENDENTES & MONITORAMENTO */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
        {/* Section Top Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Painel de Controle de Atendentes
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {agents.length} Cadastrados (Até 5 Simultâneos)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre e gerencie a equipe de discagem, defina metas diárias e turnos, e monitore chamadas ao vivo sem conflitos.
              </p>
            </div>
          </div>

          {/* Controls: View Switcher and Cadastrar Atendente Button */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAgentViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  agentViewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards ao Vivo</span>
              </button>
              <button
                type="button"
                onClick={() => setAgentViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  agentViewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabela de Gestão</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAddOperator}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cadastrar Atendente</span>
            </button>
          </div>
        </div>

        {/* Sub-bar with Status Filters and Team Meta Metrics */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setAgentStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                agentStatusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todos ({agents.length})
            </button>
            <button
              onClick={() => setAgentStatusFilter('in_call')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                agentStatusFilter === 'in_call'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
              }`}
            >
              Em Atendimento ({activeDialersCount})
            </button>
            <button
              onClick={() => setAgentStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                agentStatusFilter === 'available'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50'
              }`}
            >
              Disponíveis ({availableCount})
            </button>
            <button
              onClick={() => setAgentStatusFilter('paused')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                agentStatusFilter === 'paused'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50'
              }`}
            >
              Em Pausa ({pausedCount})
            </button>
          </div>

          {/* Team Daily Goal Summary */}
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Meta da Equipe: <strong className="text-slate-900 dark:text-white">{agents.reduce((acc, a) => acc + (a.callsCount || 0), 0)} / {agents.reduce((acc, a) => acc + (a.dailyGoal || 50), 0)}</strong> ligs
            </span>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
              Ao Vivo: <strong className="text-emerald-600 dark:text-emerald-400">{activeDialersCount} falando agora</strong>
            </span>
          </div>
        </div>

        {/* VIEW MODE 1: CARDS VIEW */}
        {agentViewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAgents.map((agent, index) => {
              const currentContact = contacts.find(
                (c) => c.lockedBy === agent.id && c.status === 'in_progress'
              );
              const totalActions = agent.callsCount + agent.whatsappCount;
              const convRate =
                totalActions > 0 ? Math.round((agent.successCount / totalActions) * 100) : 0;
              const goal = agent.dailyGoal || 50;
              const goalPercent = Math.min(100, Math.round(((agent.callsCount || 0) / goal) * 100));

              return (
                <div
                  key={agent.id}
                  className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs"
                >
                  <div>
                    {/* Top card: Name, Avatar, Edit button */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-2xl ${agent.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
                        >
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">
                              {agent.name}
                            </h4>
                            <button
                              onClick={() => handleOpenEditOperator(agent)}
                              title="Editar cadastro do atendente"
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                            {agent.role || `Operador ${index + 1}`}
                          </span>
                        </div>
                      </div>

                      {/* Status badge with click dropdown */}
                      <div className="relative group">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                            agent.status === 'in_call'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : agent.status === 'paused'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : agent.status === 'offline'
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === 'in_call'
                                ? 'bg-emerald-500 animate-pulse'
                                : agent.status === 'paused'
                                  ? 'bg-amber-500'
                                  : agent.status === 'offline'
                                    ? 'bg-slate-400'
                                    : 'bg-blue-500'
                            }`}
                          />
                          {agent.status === 'in_call'
                            ? 'Em Ligação'
                            : agent.status === 'paused'
                              ? 'Em Pausa'
                              : agent.status === 'offline'
                                ? 'Offline'
                                : 'Disponível'}
                        </span>

                        {/* Quick status switch dropdown on hover */}
                        <div className="absolute right-0 top-6 hidden group-hover:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1 z-20 w-32 text-[10px] font-bold">
                          <button
                            onClick={() => onUpdateAgentStatus(agent.id, 'available')}
                            className="px-2 py-1 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600"
                          >
                            Disponível
                          </button>
                          <button
                            onClick={() => onUpdateAgentStatus(agent.id, 'paused')}
                            className="px-2 py-1 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600"
                          >
                            Colocar em Pausa
                          </button>
                          <button
                            onClick={() => onUpdateAgentStatus(agent.id, 'offline')}
                            className="px-2 py-1 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                          >
                            Desconectar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operator Details: Shift and Extension */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {agent.shift === 'manha'
                          ? 'Turno Manhã'
                          : agent.shift === 'tarde'
                            ? 'Turno Tarde'
                            : agent.shift === 'noite'
                              ? 'Turno Noite'
                              : 'Turno Integral'}
                      </span>
                      {agent.extension && (
                        <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-teal-500" />
                          Ramal {agent.extension}
                        </span>
                      )}
                    </div>

                    {/* Realtime Call Monitoring Box */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700/80 mb-2.5 min-h-[82px] flex flex-col justify-between">
                      {currentContact ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <PhoneCall className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                              <span>Falando agora</span>
                            </span>
                            <LiveCallTimer startTime={currentContact.lockedAt} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {currentContact.name}
                            </p>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">
                              {currentContact.phone}
                            </span>
                            {currentContact.company && (
                              <span className="text-[9px] text-slate-400 block truncate">
                                {currentContact.company}
                              </span>
                            )}
                          </div>

                          {/* Admin Action for Stuck Calls */}
                          <div className="pt-1 flex items-center gap-1.5">
                            <button
                              onClick={() => onSelectContact(currentContact)}
                              className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span>Ver Lead</span>
                            </button>
                            <button
                              onClick={() => onForceReleaseContact(currentContact.id)}
                              title="Liberar contato se a chamada travou"
                              className="py-1 px-1.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <PhoneOff className="w-3 h-3" />
                              <span>Liberar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-2 text-slate-400 text-xs italic space-y-1">
                          <span>
                            {agent.status === 'paused'
                              ? 'Em intervalo de pausa'
                              : agent.status === 'offline'
                                ? 'Atendente desconectado'
                                : 'Aguardando próximo lead da fila'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Daily Goal Progress Bar */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40 mb-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-500" />
                          Meta do Dia
                        </span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {agent.callsCount} / {goal} ({goalPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            goalPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${goalPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-500">Ligações Feitas:</span>
                        <span className="font-bold font-mono">{agent.callsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-500">WhatsApps:</span>
                        <span className="font-bold font-mono text-teal-600">{agent.whatsappCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-500">Atendidos / Vendas:</span>
                        <span className="font-bold font-mono text-emerald-600">{agent.successCount}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1 mt-1">
                        <span className="text-[11px] text-slate-500">Conversão:</span>
                        <span className="font-bold font-mono text-blue-600">{convRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditOperator(agent)}
                      className="flex-1 py-1.5 text-[11px] font-bold rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Editar cadastro deste atendente"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    {onResetAgentMetrics && (
                      <button
                        onClick={() => {
                          if (confirm(`Zerar as métricas de hoje de ${agent.name}?`)) {
                            onResetAgentMetrics(agent.id);
                          }
                        }}
                        className="py-1.5 px-2 text-[11px] font-bold rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer"
                        title="Zerar métricas de hoje deste atendente"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => onSelectAgent(agent.id)}
                      className="flex-1 py-1.5 text-[11px] font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title={`Abrir discador com o perfil de ${agent.name}`}
                    >
                      <PhoneForwarded className="w-3 h-3" />
                      <span>Discador</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card at end of grid */}
            <button
              onClick={handleOpenAddOperator}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all hover:bg-blue-50/20 dark:hover:bg-blue-950/20 min-h-[360px] cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all mb-3 shadow-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                + Cadastrar Atendente
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Adicione mais um operador à equipe para atender ligações em fila simultânea.
              </p>
              <span className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2">
                Abrir formulário de cadastro
              </span>
            </button>
          </div>
        )}

        {/* VIEW MODE 2: TABLE VIEW */}
        {agentViewMode === 'table' && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Atendente / Cargo</th>
                  <th className="py-2.5 px-3">Turno & Ramal</th>
                  <th className="py-2.5 px-3">Status Operacional</th>
                  <th className="py-2.5 px-3">Meta do Dia</th>
                  <th className="py-2.5 px-3">Ligações / Whats</th>
                  <th className="py-2.5 px-3">Atendimento ao Vivo</th>
                  <th className="py-2.5 px-3 text-right">Ações Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum atendente encontrado com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const currentContact = contacts.find(
                      (c) => c.lockedBy === agent.id && c.status === 'in_progress'
                    );
                    const goal = agent.dailyGoal || 50;
                    const goalPercent = Math.min(100, Math.round(((agent.callsCount || 0) / goal) * 100));

                    return (
                      <tr key={agent.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl ${agent.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                            >
                              {agent.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {agent.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {agent.role || 'Atendente Comercial'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block">
                              {agent.shift === 'manha'
                                ? 'Manhã (08h-14h)'
                                : agent.shift === 'tarde'
                                  ? 'Tarde (14h-20h)'
                                  : agent.shift === 'noite'
                                    ? 'Noite (18h-00h)'
                                    : 'Integral (09h-18h)'}
                            </span>
                            {agent.extension && (
                              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                                Ramal {agent.extension}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <select
                            value={agent.status}
                            onChange={(e) => onUpdateAgentStatus(agent.id, e.target.value as AgentStatus)}
                            className={`py-1 px-2 text-[10px] font-bold rounded-lg border cursor-pointer focus:outline-none ${
                              agent.status === 'in_call'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : agent.status === 'paused'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                  : agent.status === 'offline'
                                    ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                                    : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            <option value="available">Disponível</option>
                            <option value="in_call">Em Chamada</option>
                            <option value="paused">Em Pausa</option>
                            <option value="offline">Offline</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span>{agent.callsCount} ligs</span>
                              <span className="font-bold">{goalPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${goalPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${goalPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-mono text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{agent.callsCount}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-teal-600 font-bold">{agent.whatsappCount} zap</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {currentContact ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <PhoneCall className="w-3 h-3 animate-pulse" />
                                <span className="truncate max-w-[130px]">{currentContact.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                <LiveCallTimer startTime={currentContact.lockedAt} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {agent.status === 'paused' ? 'Pausa' : agent.status === 'offline' ? 'Desconectado' : 'Fila livre'}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditOperator(agent)}
                              title="Editar cadastro do atendente"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {onResetAgentMetrics && (
                              <button
                                onClick={() => {
                                  if (confirm(`Reiniciar as contagens diárias de ${agent.name}?`)) {
                                    onResetAgentMetrics(agent.id);
                                  }
                                }}
                                title="Zerar métricas do dia deste atendente"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onSelectAgent(agent.id)}
                              title="Entrar no Discador com este atendente"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                            >
                              <PhoneForwarded className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteAgent(agent.id)}
                              title="Remover atendente da equipe"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Table Footer with Quick Add */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Total: {filteredAgents.length} atendentes cadastrados no painel
              </span>
              <button
                type="button"
                onClick={handleOpenAddOperator}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Novo Atendente</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TWO COLUMNS: LIVE QUEUE TABLE & AUDIT LOG STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Queue Table (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fila de Contatos & Trava Anti-Conflito
              </h3>
              <p className="text-xs text-slate-500">
                Mostrando {filteredContacts.length} de {contacts.length} contatos
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar nome, telefone, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Na Fila' },
              { id: 'in_progress', label: 'Em Atendimento' },
              { id: 'answered', label: 'Atendidos' },
              { id: 'interested', label: 'Interessados' },
              { id: 'whatsapp_sent', label: 'WhatsApp' },
              { id: 'unanswered', label: 'Não Atendem' },
              { id: 'scheduled', label: 'Reagendados' },
              { id: 'not_interested', label: 'Sem Interesse' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Contacts Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Contato / Empresa</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Status Atual</th>
                  <th className="py-2.5 px-3">Trava / Operador</th>
                  <th className="py-2.5 px-3">Duração / Obs</th>
                  <th className="py-2.5 px-3 text-right">Ações Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Nenhum contato encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => {
                    const badge = getStatusBadgeClass(contact.status);
                    const isLocked = contact.status === 'in_progress' && contact.lockedBy;

                    return (
                      <tr
                        key={contact.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {contact.name}
                          </div>
                          {contact.company && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {contact.company}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {contact.phone}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {getStatusLabel(contact.status)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {isLocked ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              <span>{contact.lockedByName || 'Operador'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Livre na fila</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {contact.callDurationSeconds ? (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatSecondsToTimer(contact.callDurationSeconds)}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                          {contact.notes && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">
                              {contact.notes}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Force Release if locked */}
                            {isLocked && (
                              <button
                                onClick={() => onForceReleaseContact(contact.id)}
                                title="Liberar trava imediatamente"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
                              >
                                <PhoneOff className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View History */}
                            <button
                              onClick={() => onSelectContact(contact)}
                              title="Ver histórico e detalhes"
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset to Pending */}
                            {contact.status !== 'pending' && (
                              <button
                                onClick={() => onResetContactToPending(contact.id)}
                                title="Devolver para a fila como pendente"
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Activity Stream (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Feed de Atividades ao Vivo</span>
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 flex-1">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhuma atividade registrada até agora.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {log.badgeType === 'lock' && (
                        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      {log.badgeType === 'call' && (
                        <PhoneCall className="w-3 h-3 text-blue-500 shrink-0" />
                      )}
                      {log.badgeType === 'whatsapp' && (
                        <MessageSquare className="w-3 h-3 text-teal-500 shrink-0" />
                      )}
                      {log.badgeType === 'success' && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      )}
                      {log.agentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatTimeAgo(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{log.action}</p>
                  <p className="text-[11px] text-slate-500 break-words">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operator Add / Edit Modal */}
      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onSave={onSaveAgent}
        onDelete={onDeleteAgent}
        agentToEdit={editingAgent}
      />
    </div>
  );
};
