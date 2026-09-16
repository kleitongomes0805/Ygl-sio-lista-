import React from 'react';
import {
  PhoneCall,
  MessageSquare,
  MessageCircle,
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  Webhook,
  Activity,
  RotateCcw,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Building2,
} from 'lucide-react';
import { Agent, WorkgroupConfig } from '../types';

interface HeaderProps {
  activeTab: 'dialer' | 'admin' | 'import-export' | 'crm';
  setActiveTab: (tab: 'dialer' | 'admin' | 'import-export' | 'crm') => void;
  currentAgentId: string;
  setCurrentAgentId: (agentId: string) => void;
  agents: Agent[];
  isConnected: boolean;
  onResetSample: () => void;
  onOpenQuickWhatsApp: () => void;
  isAdminAuthenticated: boolean;
  onOpenAdminAccess: () => void;
  onLogoutAdmin: () => void;
  isDefaultPassword?: boolean;
  onOpenChangePassword?: () => void;
  workgroup?: WorkgroupConfig;
  onOpenWorkgroupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentAgentId,
  setCurrentAgentId,
  agents,
  isConnected,
  onResetSample,
  onOpenQuickWhatsApp,
  isAdminAuthenticated,
  onOpenAdminAccess,
  onLogoutAdmin,
  isDefaultPassword = true,
  onOpenChangePassword,
  workgroup,
  onOpenWorkgroupModal,
}) => {

  const currentAgent = agents.find((a) => a.id === currentAgentId);
  const isSupervisor = currentAgentId === 'supervisor';

  const handleAdminTabClick = () => {
    if (!isAdminAuthenticated) {
      onOpenAdminAccess();
    } else {
      setActiveTab('admin');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white font-mono">
                    FilaDial
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Até 5 Operadores
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Discador em Fila Anti-Conflito & WhatsApp Integrado
                </p>
              </div>
            </div>

            {/* Connection status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <span className="font-medium text-[11px]">
                {isConnected ? 'Tempo Real Ativo' : 'Conectando...'}
              </span>
            </div>
          </div>

          {/* Center / Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 w-full md:w-auto overflow-x-auto">
            <button
              id="tab-dialer"
              onClick={() => setActiveTab('dialer')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'dialer'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Discador da Fila</span>
            </button>

            <button
              id="tab-admin"
              onClick={handleAdminTabClick}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Painel Gerencial</span>
              {!isAdminAuthenticated && (
                <Lock className="w-3 h-3 text-amber-500" title="Acesso protegido para Admin" />
              )}
            </button>

            <button
              id="tab-import-export"
              onClick={() => setActiveTab('import-export')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'import-export'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Importar / Exportar</span>
            </button>

            <button
              id="tab-crm"
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'crm'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Webhook className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>API & CRM</span>
            </button>
          </nav>

          {/* Right: Quick WhatsApp, Operator Selector & Reset */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
            {/* Admin Access Status / Button */}
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {onOpenChangePassword && (
                  <button
                    id="btn-header-change-password"
                    onClick={onOpenChangePassword}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isDefaultPassword
                        ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                    title={
                      isDefaultPassword
                        ? 'Aviso de Segurança: Senha padrão admin123 em uso! Clique para alterar.'
                        : 'Alterar senha do Administrador'
                    }
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="hidden lg:inline">
                      {isDefaultPassword ? 'Trocar Senha Padrão' : 'Senha Admin'}
                    </span>
                  </button>
                )}

                <button
                  id="btn-header-admin-active"
                  onClick={onLogoutAdmin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-blue-700 dark:text-blue-300 hover:text-rose-700 dark:hover:text-rose-300 border border-blue-200 dark:border-blue-800 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
                  title="Sessão de Administrador Ativa. Clique para bloquear / sair."
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:hidden" />
                  <Lock className="w-3.5 h-3.5 text-rose-500 hidden group-hover:block" />
                  <span className="group-hover:hidden">Admin Ativo</span>
                  <span className="hidden group-hover:inline">Sair Admin</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-header-admin-login"
                onClick={onOpenAdminAccess}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Acesso restrito para Administrador gerenciar operadores e monitorar"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Acesso Admin</span>
              </button>
            )}

            <button
              id="btn-header-quick-whatsapp"
              onClick={onOpenQuickWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Iniciar conversa rápida no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>WhatsApp</span>
            </button>

            {/* Workgroup Button / Switch Profile */}
            {onOpenWorkgroupModal && (
              <button
                id="btn-header-workgroup"
                onClick={onOpenWorkgroupModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Grupo de Trabalho ativo. Clique para trocar de perfil ou grupo."
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="max-w-[130px] truncate hidden sm:inline">
                  {workgroup?.name || 'Grupo de Trabalho'}
                </span>
                <span className="sm:hidden">Grupo</span>
              </button>
            )}


            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Users className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                <label
                  htmlFor="operator-select"
                  className="text-[10px] text-slate-500 font-medium leading-none"
                >
                  Perfil Ativo nesta Aba:
                </label>
                <select
                  id="operator-select"
                  value={currentAgentId}
                  onChange={(e) => setCurrentAgentId(e.target.value)}
                  className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none cursor-pointer py-0.5"
                >
                  <option value="supervisor">👑 Supervisor (Visão Geral)</option>
                  <optgroup label="5 Operadores Simultâneos:">
                    {agents.map((ag, idx) => (
                      <option key={ag.id} value={ag.id}>
                        👤 {idx + 1}. {ag.name} ({ag.status})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <button
              id="btn-reset-sample"
              onClick={onResetSample}
              title="Recarregar dados de teste padrão"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
