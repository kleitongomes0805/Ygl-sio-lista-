/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DialerQueueView } from './components/DialerQueueView';
import { AdminDashboard } from './components/AdminDashboard';
import { ImportExportView } from './components/ImportExportView';
import { CrmIntegrationView } from './components/CrmIntegrationView';
import { ContactHistoryModal } from './components/ContactHistoryModal';
import { QuickWhatsAppModal } from './components/QuickWhatsAppModal';
import { AdminAccessModal } from './components/AdminAccessModal';
import { ChangeAdminPasswordModal } from './components/ChangeAdminPasswordModal';
import { WorkgroupConfigModal } from './components/WorkgroupConfigModal';
import { WorkgroupLoginModal } from './components/WorkgroupLoginModal';
import { AgentFormData } from './components/OperatorModal';
import { Contact, Agent, QueueStats, ActivityLog, ContactStatus, AgentStatus, WorkgroupConfig } from './types';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';


export default function App() {
  const [activeTab, setActiveTab] = useState<'dialer' | 'admin' | 'import-export' | 'crm'>('dialer');

  // Admin Authentication & Password State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('filadial_admin_auth') === 'true';
  });
  const [isAdminAccessModalOpen, setIsAdminAccessModalOpen] = useState<boolean>(false);
  const [isDefaultPassword, setIsDefaultPassword] = useState<boolean>(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isFirstAccessChangePrompt, setIsFirstAccessChangePrompt] = useState<boolean>(false);

  // Agent selector (persisted per tab/session in sessionStorage)
  const [currentAgentId, setCurrentAgentIdState] = useState<string>(() => {
    return sessionStorage.getItem('filadial_agent_id') || 'agent_1';
  });

  const setCurrentAgentId = (id: string) => {
    sessionStorage.setItem('filadial_agent_id', id);
    setCurrentAgentIdState(id);
  };

  // Real-time State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    answeredCount: 0,
    whatsappCount: 0,
    conversionRate: 0,
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [apiKey, setApiKey] = useState<string>('fd_live_sk_loading');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal for contact history
  const [historyModalContact, setHistoryModalContact] = useState<Contact | null>(null);

  // Modal for Quick WhatsApp
  const [isQuickWhatsAppOpen, setIsQuickWhatsAppOpen] = useState<boolean>(false);
  const [quickWhatsAppPhone, setQuickWhatsAppPhone] = useState<string>('');
  const [quickWhatsAppName, setQuickWhatsAppName] = useState<string>('');

  // Workgroup (Cliente & Grupo de Trabalho) State
  const [workgroup, setWorkgroup] = useState<WorkgroupConfig | null>(null);
  const [isWorkgroupLoginOpen, setIsWorkgroupLoginOpen] = useState<boolean>(() => {
    // Open on first launch if operator hasn't authenticated into a workgroup yet
    return localStorage.getItem('filadial_workgroup_auth') !== 'true';
  });
  const [isWorkgroupConfigModalOpen, setIsWorkgroupConfigModalOpen] = useState<boolean>(false);

  const handleOpenQuickWhatsApp = (phone: string = '', name: string = '') => {
    setQuickWhatsAppPhone(phone);
    setQuickWhatsAppName(name);
    setIsQuickWhatsAppOpen(true);
  };

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'error' | 'success' | 'warning'; message: string } | null>(null);

  const showToast = useCallback((type: 'error' | 'success' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Fetch full state once
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setAgents(data.agents || []);
        setStats(data.stats || stats);
        setLogs(data.recentLogs || []);
        setApiKey(data.apiKey || '');
        setWebhookUrl(data.webhookUrl || '');
        if (data.isDefaultPassword !== undefined) {
          setIsDefaultPassword(Boolean(data.isDefaultPassword));
        }
        if (data.workgroup) {
          setWorkgroup(data.workgroup);
        }
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  }, []);

  // Server-Sent Events (SSE) Listener for Real-Time Multi-Operator Sync
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: number | null = null;

    const setupSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.data) {
            setContacts(payload.data.contacts || []);
            setAgents(payload.data.agents || []);
            setStats(payload.data.stats || stats);
            setLogs(payload.data.recentLogs || []);
            if (payload.data.apiKey) setApiKey(payload.data.apiKey);
            if (typeof payload.data.webhookUrl === 'string') setWebhookUrl(payload.data.webhookUrl);
            if (payload.data.isDefaultPassword !== undefined) {
              setIsDefaultPassword(Boolean(payload.data.isDefaultPassword));
            }
            if (payload.data.workgroup) {
              setWorkgroup(payload.data.workgroup);
            }
          }
        } catch (err) {
          console.error('SSE JSON error:', err);
        }
      };


      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimeout = window.setTimeout(() => {
          setupSSE();
        }, 3000);
      };
    };

    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchState]);

  // Current operator
  const currentAgent = agents.find((a) => a.id === currentAgentId);
  const isSupervisor = currentAgentId === 'supervisor';

  // --- ACTIONS ---

  // Pull Next Available Contact
  const handlePullNext = async () => {
    if (!currentAgent) {
      showToast('warning', 'Selecione um dos 5 operadores para puxar leads da fila.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/pull-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentAgent.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('warning', data.message || 'Nenhum contato pendente na fila.');
      } else {
        if (data.alreadyLocked) {
          showToast('warning', `Você já estava com ${data.contact.name} em atendimento.`);
        } else {
          showToast('success', `Lead "${data.contact.name}" alocado e bloqueado para você.`);
        }
      }
    } catch (err: any) {
      showToast('error', 'Erro ao puxar da fila: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Lock Specific Contact (Anti-collision enforcement)
  const handleLockContact = async (contactId: string) => {
    if (!currentAgent) {
      showToast('warning', 'Selecione um operador antes de puxar um contato.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, agentId: currentAgent.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        // 409 Conflict: Already locked by another operator!
        showToast(
          'error',
          data.error || 'Este contato acabou de ser atendido por outro operador!'
        );
      } else {
        showToast('success', 'Contato bloqueado exclusivamente para você!');
      }
    } catch (err: any) {
      showToast('error', 'Falha ao travar contato: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Release Locked Contact (Cancel / Give up)
  const handleReleaseContact = async (contactId: string, reason?: string) => {
    try {
      const res = await fetch('/api/queue/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          agentId: currentAgent?.id || 'supervisor',
          reason,
        }),
      });
      if (res.ok) {
        showToast('warning', 'Contato devolvido à fila para outros operadores.');
      }
    } catch (err: any) {
      showToast('error', 'Erro ao liberar contato: ' + err.message);
    }
  };

  // Complete Call / WhatsApp and Save Outcome
  const handleCompleteContact = async (params: {
    contactId: string;
    status: ContactStatus;
    notes: string;
    actionType: 'call' | 'whatsapp';
    callDurationSeconds: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          agentId: currentAgent?.id || 'supervisor',
        }),
      });

      if (res.ok) {
        showToast('success', 'Status salvo com sucesso! Lead registrado na lista exportável.');
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Erro ao registrar status');
      }
    } catch (err: any) {
      showToast('error', 'Erro ao finalizar contato: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Agent Status
  const handleAgentStatusChange = async (status: Agent['status']) => {
    if (!currentAgent) return;
    try {
      await fetch('/api/agents/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentAgent.id, status }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Import Contacts
  const handleImportContacts = async (newContacts: any[], mode: 'append' | 'replace') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts, mode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro na importação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Queue
  const handleClearQueue = async (target: 'all' | 'completed') => {
    setIsLoading(true);
    try {
      await fetch('/api/queue/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      showToast('success', target === 'completed' ? 'Contatos concluídos removidos' : 'Fila zerada com sucesso');
    } catch (err: any) {
      showToast('error', 'Erro ao limpar fila: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Demo Sample Data
  const handleResetSample = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/reset-sample', { method: 'POST' });
      if (res.ok) {
        showToast('success', 'Fila restaurada com os 12 contatos e 5 operadores de demonstração.');
      }
    } catch (err: any) {
      showToast('error', 'Erro ao resetar dados: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update CRM Config
  const handleUpdateCrmConfig = async (url: string, regenerateKey?: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url, regenerateKey }),
      });
      const data = await res.json();
      if (data.apiKey) setApiKey(data.apiKey);
      if (typeof data.webhookUrl === 'string') setWebhookUrl(data.webhookUrl);
    } finally {
      setIsLoading(false);
    }
  };

  // Test Outbound Webhook
  const handleTestWebhook = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/test-webhook', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Webhook de teste disparado com sucesso!');
      } else {
        showToast('error', data.error || 'Falha ao testar webhook');
      }
    } catch (err: any) {
      showToast('error', 'Erro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Single Contact to Pending
  const handleResetContactToPending = async (contactId: string) => {
    await handleReleaseContact(contactId, 'Administrador resetou contato para pendente');
    showToast('success', 'Contato retornado para a fila.');
  };

  // --- ADMIN ACTIONS ---
  const handleAdminAuthenticated = (isDefaultPass: boolean) => {
    setIsAdminAuthenticated(true);
    setIsAdminAccessModalOpen(false);
    setActiveTab('admin');
    showToast('success', 'Acesso de Administrador autenticado com sucesso!');

    // Se for o primeiro acesso usando a senha padrão admin123, abre o fluxo de troca de senha
    if (isDefaultPass) {
      setTimeout(() => {
        setIsFirstAccessChangePrompt(true);
        setIsChangePasswordModalOpen(true);
      }, 400);
    }
  };

  const handlePasswordChangeSuccess = (_newPassword: string) => {
    setIsDefaultPassword(false);
    setIsChangePasswordModalOpen(false);
    setIsFirstAccessChangePrompt(false);
    showToast('success', 'Nova senha do Administrador salva com sucesso!');
  };

  const handleLockAdminSession = () => {
    localStorage.removeItem('filadial_admin_auth');
    setIsAdminAuthenticated(false);
    showToast('warning', 'Sessão de Administrador bloqueada.');
  };

  // Save Operator (Add or Edit)
  const handleSaveAgent = async (agentData: AgentFormData) => {
    setIsLoading(true);
    try {
      if (agentData.id) {
        // Edit existing operator
        const res = await fetch(`/api/agents/${agentData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar atendente');
        showToast('success', `Atendente "${agentData.name}" atualizado com sucesso!`);
      } else {
        // Add new operator
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar atendente');
        showToast('success', `Atendente "${agentData.name}" cadastrado com sucesso!`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao salvar atendente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Single Agent Daily Metrics (Admin)
  const handleResetAgentMetrics = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/reset-metrics`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao zerar métricas');
      showToast('success', 'Métricas diárias do atendente reiniciadas com sucesso.');
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao zerar métricas');
    }
  };

  // Remove Operator
  const handleDeleteAgent = async (agentId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover operador');
      showToast('success', 'Operador removido da equipe com sucesso.');
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao remover operador');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Status Direct (Admin)
  const handleUpdateAgentStatusDirect = async (agentId: string, status: AgentStatus) => {
    try {
      const res = await fetch('/api/agents/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao atualizar status');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Force Release Contact Lock (Admin)
  const handleForceReleaseContact = async (contactId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/force-release-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao liberar contato');
      showToast('success', 'Chamada liberada e contato devolvido para a fila!');
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Workgroup Configuration Save (Admin)
  const handleSaveWorkgroupConfig = async (cfg: {
    name: string;
    clientName: string;
    password: string;
    description?: string;
  }) => {
    try {
      const res = await fetch('/api/workgroup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar grupo de trabalho');
      setWorkgroup(data.workgroup);
      showToast('success', 'Cliente e Grupo de Trabalho atualizados com sucesso!');
    } catch (err: any) {
      showToast('error', err.message);
      throw err;
    }
  };

  // Workgroup Operator Authentication
  const handleWorkgroupAuthenticated = (wg: { name: string; clientName: string; description?: string }) => {
    localStorage.setItem('filadial_workgroup_auth', 'true');
    showToast('success', `Acesso validado ao grupo "${wg.name}". Encontre seu perfil para trabalhar!`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentAgentId={currentAgentId}
        setCurrentAgentId={setCurrentAgentId}
        agents={agents}
        isConnected={isConnected}
        onResetSample={handleResetSample}
        onOpenQuickWhatsApp={() => handleOpenQuickWhatsApp()}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminAccess={() => setIsAdminAccessModalOpen(true)}
        onLogoutAdmin={handleLockAdminSession}
        isDefaultPassword={isDefaultPassword}
        onOpenChangePassword={() => {
          setIsFirstAccessChangePrompt(isDefaultPassword);
          setIsChangePasswordModalOpen(true);
        }}
        workgroup={workgroup || undefined}
        onOpenWorkgroupModal={() => setIsWorkgroupLoginOpen(true)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toast.type === 'warning'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toast.type === 'error' && <ShieldAlert className="w-5 h-5 shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dialer' && (
          <DialerQueueView
            currentAgent={currentAgent}
            isSupervisor={isSupervisor}
            contacts={contacts}
            agents={agents}
            onPullNext={handlePullNext}
            onLockContact={handleLockContact}
            onReleaseContact={handleReleaseContact}
            onCompleteContact={handleCompleteContact}
            onAgentStatusChange={handleAgentStatusChange}
            onSelectAgent={setCurrentAgentId}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            stats={stats}
            agents={agents}
            contacts={contacts}
            logs={logs}
            onSelectContact={setHistoryModalContact}
            onResetContactToPending={handleResetContactToPending}
            onSelectAgent={(agentId) => {
              setCurrentAgentId(agentId);
              setActiveTab('dialer');
            }}
            isAdminAuthenticated={isAdminAuthenticated}
            onOpenAdminAccess={() => setIsAdminAccessModalOpen(true)}
            onLockAdminSession={handleLockAdminSession}
            onSaveAgent={handleSaveAgent}
            onDeleteAgent={handleDeleteAgent}
            onUpdateAgentStatus={handleUpdateAgentStatusDirect}
            onForceReleaseContact={handleForceReleaseContact}
            onResetAgentMetrics={handleResetAgentMetrics}
            isDefaultPassword={isDefaultPassword}
            onOpenChangePassword={() => {
              setIsFirstAccessChangePrompt(isDefaultPassword);
              setIsChangePasswordModalOpen(true);
            }}
            currentWorkgroup={workgroup || undefined}
            onOpenWorkgroupConfig={() => setIsWorkgroupConfigModalOpen(true)}
          />
        )}

        {activeTab === 'import-export' && (
          <ImportExportView
            contacts={contacts}
            onImportContacts={handleImportContacts}
            onClearQueue={handleClearQueue}
            onResetSample={handleResetSample}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'crm' && (
          <CrmIntegrationView
            apiKey={apiKey}
            webhookUrl={webhookUrl}
            onUpdateConfig={handleUpdateCrmConfig}
            onTestWebhook={handleTestWebhook}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Contact History Detail Modal */}
      {historyModalContact && (
        <ContactHistoryModal
          contact={historyModalContact}
          onClose={() => setHistoryModalContact(null)}
        />
      )}

      {/* Quick WhatsApp Conversation Modal */}
      <QuickWhatsAppModal
        contacts={contacts}
        isOpen={isQuickWhatsAppOpen}
        onClose={() => setIsQuickWhatsAppOpen(false)}
        defaultPhone={quickWhatsAppPhone}
        defaultName={quickWhatsAppName}
      />

      {/* Admin Access & Login Modal */}
      <AdminAccessModal
        isOpen={isAdminAccessModalOpen}
        onClose={() => setIsAdminAccessModalOpen(false)}
        onSuccess={handleAdminAuthenticated}
        isDefaultPassword={isDefaultPassword}
      />

      {/* Change Admin Password Modal */}
      <ChangeAdminPasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => {
          setIsChangePasswordModalOpen(false);
          setIsFirstAccessChangePrompt(false);
        }}
        onSuccess={handlePasswordChangeSuccess}
        isFirstAccess={isFirstAccessChangePrompt || isDefaultPassword}
      />

      {/* Workgroup Login & Operator Profile Finder Modal */}
      <WorkgroupLoginModal
        isOpen={isWorkgroupLoginOpen}
        onClose={() => setIsWorkgroupLoginOpen(false)}
        agents={agents}
        currentAgentId={currentAgentId}
        onSelectAgent={(agentId) => {
          setCurrentAgentId(agentId);
          localStorage.setItem('filadial_workgroup_auth', 'true');
          const found = agents.find((a) => a.id === agentId);
          showToast('success', `Perfil de ${found?.name || 'operador'} selecionado para trabalho!`);
        }}
        savedWorkgroup={workgroup}
        onWorkgroupAuthenticated={handleWorkgroupAuthenticated}
        canDismiss={true}
      />

      {/* Workgroup & Client Configuration Modal (Admin) */}
      <WorkgroupConfigModal
        isOpen={isWorkgroupConfigModalOpen}
        onClose={() => setIsWorkgroupConfigModalOpen(false)}
        currentWorkgroup={workgroup || undefined}
        onSave={handleSaveWorkgroupConfig}
        operatorCount={agents.length}
      />
    </div>
  );
}

