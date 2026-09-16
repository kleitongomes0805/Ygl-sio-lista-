import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Types
type ContactStatus =
  | 'pending'
  | 'in_progress'
  | 'answered'
  | 'interested'
  | 'scheduled'
  | 'unanswered'
  | 'busy'
  | 'voicemail'
  | 'not_interested'
  | 'wrong_number'
  | 'whatsapp_sent';

interface ContactHistoryItem {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  action: 'call' | 'whatsapp' | 'status_change' | 'note' | 'crm_sync';
  status?: ContactStatus;
  notes?: string;
  durationSeconds?: number;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  company?: string;
  email?: string;
  status: ContactStatus;
  lockedBy?: string | null;
  lockedByName?: string | null;
  lockedAt?: number | null;
  notes?: string;
  callDurationSeconds?: number;
  lastOutcome?: string;
  lastContactedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  history: ContactHistoryItem[];
  customFields?: Record<string, string>;
}

type AgentStatus = 'available' | 'in_call' | 'in_whatsapp' | 'paused' | 'offline';

interface Agent {
  id: string;
  name: string;
  color: string;
  avatarBg: string;
  status: AgentStatus;
  currentContactId?: string | null;
  callsCount: number;
  whatsappCount: number;
  successCount: number;
  lastActiveAt: number;
  role?: string;
  extension?: string;
  dailyGoal?: number;
  shift?: 'manha' | 'tarde' | 'noite' | 'integral';
}

interface ActivityLog {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  contactId?: string;
  contactName?: string;
  action: string;
  badgeType: 'call' | 'whatsapp' | 'lock' | 'success' | 'warning' | 'info';
  details: string;
}

interface WorkgroupConfig {
  name: string;
  clientName: string;
  password: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// Helpers
function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits;
  }
  return digits;
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return raw;
}

// Initial Sample Contacts
const initialContacts: Contact[] = [
  {
    id: 'ct-101',
    name: 'Roberto Ferreira Alcantara',
    phone: '(11) 98765-4321',
    cleanPhone: '5511987654321',
    company: 'Construtora Horizonte',
    email: 'roberto@horizonte.com.br',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 5,
    history: [],
  },
  {
    id: 'ct-102',
    name: 'Juliana Mendes Rocha',
    phone: '(21) 99123-8877',
    cleanPhone: '5521991238877',
    company: 'Rocha & Associados',
    email: 'juliana@rocha.adv.br',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    history: [],
  },
  {
    id: 'ct-103',
    name: 'André Guimarães Prado',
    phone: '(31) 98455-1122',
    cleanPhone: '5531984551122',
    company: 'Prado Logística Integrada',
    email: 'andre@pradolog.com.br',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    history: [],
  },
  {
    id: 'ct-104',
    name: 'Camila Vasconcelos',
    phone: '(41) 97788-9900',
    cleanPhone: '5541977889900',
    company: 'Inovare Tecnologia',
    email: 'camila@inovare.io',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    history: [],
  },
  {
    id: 'ct-105',
    name: 'Marcelo Pires Nogueira',
    phone: '(19) 99344-5566',
    cleanPhone: '5519993445566',
    company: 'Agro Pires Brasil',
    email: 'marcelo@agropires.com.br',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    history: [],
  },
  {
    id: 'ct-106',
    name: 'Fernanda Diniz Cavalcanti',
    phone: '(81) 98122-3344',
    cleanPhone: '5581981223344',
    company: 'Soluções Náuticas Nordeste',
    email: 'fernanda@nauticasne.com',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    history: [],
  },
  {
    id: 'ct-107',
    name: 'Thiago Barbosa Siqueira',
    phone: '(47) 99655-7788',
    cleanPhone: '5547996557788',
    company: 'Têxtil Santa Catarina',
    email: 'thiago@textilsc.ind.br',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    history: [],
  },
  {
    id: 'ct-108',
    name: 'Patrícia Duarte Fontes',
    phone: '(61) 98899-4455',
    cleanPhone: '5561988994455',
    company: 'Capital Consultoria',
    email: 'patricia@capitalgov.com',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    history: [],
  },
  {
    id: 'ct-109',
    name: 'Gabriel Rezende Maia',
    phone: '(71) 99233-1122',
    cleanPhone: '5571992331122',
    company: 'Bahia Solar & Energia',
    email: 'gabriel@bahiasolar.com.br',
    status: 'pending',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
    history: [],
  },
  {
    id: 'ct-110',
    name: 'Aline Miranda Castro',
    phone: '(51) 98711-2233',
    cleanPhone: '5551987112233',
    company: 'Sul Alimentos Naturais',
    email: 'aline@sulalimentos.com.br',
    status: 'pending',
    createdAt: Date.now() - 900000,
    updatedAt: Date.now() - 900000,
    history: [],
  },
  {
    id: 'ct-111',
    name: 'Eduardo Silveira Ramos',
    phone: '(11) 99877-6655',
    cleanPhone: '5511998776655',
    company: 'Fintech PagExpress',
    email: 'eduardo@pagexpress.io',
    status: 'pending',
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 600000,
    history: [],
  },
  {
    id: 'ct-112',
    name: 'Letícia Albuquerque Viana',
    phone: '(85) 98422-9988',
    cleanPhone: '5585984229988',
    company: 'Viana Hotéis & Turismo',
    email: 'leticia@vianahoteis.com.br',
    status: 'pending',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
    history: [],
  }
];

// Initial 5 Agents
const initialAgents: Agent[] = [
  {
    id: 'agent_1',
    name: 'Carlos Silva',
    color: '#3B82F6', // Blue
    avatarBg: 'bg-blue-600',
    status: 'available',
    currentContactId: null,
    callsCount: 0,
    whatsappCount: 0,
    successCount: 0,
    lastActiveAt: Date.now(),
    role: 'Atendente Comercial',
    extension: '101',
    dailyGoal: 50,
    shift: 'integral',
  },
  {
    id: 'agent_2',
    name: 'Mariana Costa',
    color: '#10B981', // Emerald
    avatarBg: 'bg-emerald-600',
    status: 'available',
    currentContactId: null,
    callsCount: 0,
    whatsappCount: 0,
    successCount: 0,
    lastActiveAt: Date.now(),
    role: 'Atendente Comercial',
    extension: '102',
    dailyGoal: 50,
    shift: 'integral',
  },
  {
    id: 'agent_3',
    name: 'Lucas Oliveira',
    color: '#8B5CF6', // Purple
    avatarBg: 'bg-purple-600',
    status: 'available',
    currentContactId: null,
    callsCount: 0,
    whatsappCount: 0,
    successCount: 0,
    lastActiveAt: Date.now(),
    role: 'Atendente Comercial',
    extension: '103',
    dailyGoal: 50,
    shift: 'manha',
  },
  {
    id: 'agent_4',
    name: 'Beatriz Lima',
    color: '#F59E0B', // Amber
    avatarBg: 'bg-amber-600',
    status: 'available',
    currentContactId: null,
    callsCount: 0,
    whatsappCount: 0,
    successCount: 0,
    lastActiveAt: Date.now(),
    role: 'Atendente Comercial',
    extension: '104',
    dailyGoal: 50,
    shift: 'tarde',
  },
  {
    id: 'agent_5',
    name: 'Rafael Santos',
    color: '#EC4899', // Pink
    avatarBg: 'bg-pink-600',
    status: 'available',
    currentContactId: null,
    callsCount: 0,
    whatsappCount: 0,
    successCount: 0,
    lastActiveAt: Date.now(),
    role: 'Atendente Comercial',
    extension: '105',
    dailyGoal: 50,
    shift: 'integral',
  },
];

// Server In-Memory Database
class Database {
  contacts: Contact[] = [...initialContacts];
  agents: Agent[] = [...initialAgents];
  activityLogs: ActivityLog[] = [
    {
      id: 'log-init-1',
      timestamp: Date.now() - 3600000,
      agentId: 'system',
      agentName: 'Sistema',
      action: 'Fila Inicializada',
      badgeType: 'info',
      details: '12 contatos carregados na fila de discagem.',
    },
  ];
  crmApiKey: string = 'fd_live_sk_9a8b7c6d5e4f3a2b1c';
  crmWebhookUrl: string = '';
  // Admin password configuration (Starts as admin123 for first access)
  adminPassword: string = 'admin123';
  isDefaultPassword: boolean = true;
  // Workgroup / Grupo de Trabalho & Senha do Grupo
  workgroup: WorkgroupConfig = {
    name: 'Equipe Comercial Matriz',
    clientName: 'Cliente Matriz',
    password: 'grupo123',
    description: 'Grupo padrão de atendimento e discagem da equipe',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  };
  // 5 minutes lock expiry if tab crashed without finishing
  lockTimeoutMs = 5 * 60 * 1000;

  getStats() {
    const total = this.contacts.length;
    const pending = this.contacts.filter((c) => c.status === 'pending').length;
    const inProgress = this.contacts.filter((c) => c.status === 'in_progress').length;
    const completed = total - pending - inProgress;
    const answeredCount = this.contacts.filter((c) =>
      ['answered', 'interested', 'scheduled'].includes(c.status)
    ).length;
    const whatsappCount = this.contacts.filter((c) => c.status === 'whatsapp_sent').length;
    const totalProcessed = completed;
    const conversionRate =
      totalProcessed > 0 ? Math.round((answeredCount / totalProcessed) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      answeredCount,
      whatsappCount,
      conversionRate,
    };
  }

  addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 100) {
      this.activityLogs = this.activityLogs.slice(0, 100);
    }
  }

  // Release stale locks
  cleanupStaleLocks() {
    const now = Date.now();
    let releasedCount = 0;
    this.contacts.forEach((c) => {
      if (c.status === 'in_progress' && c.lockedAt && now - c.lockedAt > this.lockTimeoutMs) {
        c.status = 'pending';
        c.lockedBy = null;
        c.lockedByName = null;
        c.lockedAt = null;
        releasedCount++;
      }
    });
    if (releasedCount > 0) {
      this.addLog({
        agentId: 'system',
        agentName: 'Sistema',
        action: 'Liberação de Trava',
        badgeType: 'warning',
        details: `${releasedCount} contato(s) liberado(s) por inatividade/tempo expirado.`,
      });
    }
  }
}

const db = new Database();

// SSE Clients Registry
const sseClients: Set<Response> = new Set();

function broadcastState() {
  db.cleanupStaleLocks();
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    data: {
      contacts: db.contacts,
      agents: db.agents,
      stats: db.getStats(),
      recentLogs: db.activityLogs.slice(0, 30),
      apiKey: db.crmApiKey,
      webhookUrl: db.crmWebhookUrl,
      isDefaultPassword: db.isDefaultPassword,
      workgroup: db.workgroup,
    },
  });

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}

// Asynchronous Webhook Dispatcher
async function triggerCrmWebhook(event: string, payload: Record<string, unknown>) {
  if (!db.crmWebhookUrl) return;
  try {
    const res = await fetch(db.crmWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FilaDial-Event': event,
        'X-FilaDial-Key': db.crmApiKey,
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
      signal: AbortSignal.timeout(5000),
    });
    db.addLog({
      agentId: 'system',
      agentName: 'CRM Webhook',
      action: 'Webhook Enviado',
      badgeType: res.ok ? 'success' : 'warning',
      details: `Status ${res.status} enviado para ${db.crmWebhookUrl}`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha de conexão';
    db.addLog({
      agentId: 'system',
      agentName: 'CRM Webhook',
      action: 'Falha no Webhook',
      badgeType: 'warning',
      details: `Erro ao enviar para ${db.crmWebhookUrl}: ${errorMsg}`,
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Current State
  app.get('/api/state', (_req: Request, res: Response) => {
    db.cleanupStaleLocks();
    res.json({
      contacts: db.contacts,
      agents: db.agents,
      stats: db.getStats(),
      recentLogs: db.activityLogs.slice(0, 30),
      apiKey: db.crmApiKey,
      webhookUrl: db.crmWebhookUrl,
      isDefaultPassword: db.isDefaultPassword,
      workgroup: db.workgroup,
    });
  });

  // Server-Sent Events (SSE) Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Send initial snapshot
    const initialPayload = JSON.stringify({
      type: 'INIT_STATE',
      data: {
        contacts: db.contacts,
        agents: db.agents,
        stats: db.getStats(),
        recentLogs: db.activityLogs.slice(0, 30),
        apiKey: db.crmApiKey,
        webhookUrl: db.crmWebhookUrl,
        isDefaultPassword: db.isDefaultPassword,
        workgroup: db.workgroup,
      },
    });
    res.write(`data: ${initialPayload}\n\n`);

    // Keepalive ping every 20s
    const interval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

  // --- WORKGROUP & CLIENT CONFIGURATION & LOGIN ---

  // Get current Workgroup & Client Information
  app.get('/api/workgroup', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      workgroup: db.workgroup,
    });
  });

  // Admin Configures Client, Workgroup and Group Password
  // "Quando o Admin cadastra cliente, ele cadastra o grupo de trabalho e a senha do grupo"
  app.post('/api/workgroup/config', (req: Request, res: Response) => {
    const { name, clientName, password, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O Nome do Grupo de Trabalho é obrigatório.' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'A Senha do Grupo é obrigatória.' });
    }

    const prevName = db.workgroup.name;
    db.workgroup = {
      name: name.trim(),
      clientName: clientName && typeof clientName === 'string' && clientName.trim()
        ? clientName.trim()
        : db.workgroup.clientName || 'Cliente',
      password: password.trim(),
      description: typeof description === 'string' ? description.trim() : db.workgroup.description,
      createdAt: db.workgroup.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Grupo Configurado',
      badgeType: 'info',
      details: `Cliente: "${db.workgroup.clientName}" | Grupo: "${db.workgroup.name}" cadastrado com sucesso. Senha da equipe atualizada.`,
    });

    broadcastState();
    return res.json({
      success: true,
      message: 'Grupo de trabalho e senha salvos com sucesso!',
      workgroup: db.workgroup,
    });
  });

  // Operator Enters Workgroup with Group Name and Group Password
  // "Quando o operador baixar o app ele colocar o nome do grupo de trabalho e a senha do grupo. Lá ele encontra seu perfil para trabalho"
  app.post('/api/workgroup/login', (req: Request, res: Response) => {
    const { groupName, groupPassword } = req.body;

    if (!groupName || typeof groupName !== 'string' || !groupName.trim()) {
      return res.status(400).json({ error: 'Por favor, informe o Nome do Grupo de Trabalho.' });
    }
    if (!groupPassword || typeof groupPassword !== 'string' || !groupPassword.trim()) {
      return res.status(400).json({ error: 'Por favor, informe a Senha do Grupo.' });
    }

    const inputName = groupName.trim().toLowerCase();
    const actualGroupName = db.workgroup.name.trim().toLowerCase();
    const actualClientName = (db.workgroup.clientName || '').trim().toLowerCase();

    // Flexible match on workgroup name or client name
    const isNameMatch = inputName === actualGroupName || inputName === actualClientName;
    const isPasswordMatch = groupPassword.trim() === db.workgroup.password.trim();

    if (!isNameMatch || !isPasswordMatch) {
      return res.status(401).json({
        error: 'Nome do grupo ou senha do grupo incorretos. Verifique com seu Administrador ou Supervisor.',
        hint: `O grupo cadastrado atualmente é "${db.workgroup.name}". Verifique se a senha informada está correta.`,
      });
    }

    // Success! Return workgroup info AND the list of agents so the operator can select their profile!
    return res.json({
      success: true,
      message: `Conectado ao grupo "${db.workgroup.name}" com sucesso!`,
      workgroup: {
        name: db.workgroup.name,
        clientName: db.workgroup.clientName,
        description: db.workgroup.description,
      },
      agents: db.agents,
    });
  });


  // Update Agent Status / Heartbeat
  app.post('/api/agents/status', (req: Request, res: Response) => {
    const { agentId, status, name } = req.body;
    const agent = db.agents.find((a) => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Operador não encontrado' });
    }

    if (name) agent.name = name;
    if (status) agent.status = status;
    agent.lastActiveAt = Date.now();

    broadcastState();
    return res.json({ success: true, agent });
  });

  // Admin Authentication Verification
  app.post('/api/admin/auth', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === db.adminPassword) {
      return res.json({
        success: true,
        message: 'Autenticado com sucesso como Administrador',
        role: 'admin',
        isDefaultPassword: db.isDefaultPassword,
      });
    }
    return res.status(401).json({
      error: db.isDefaultPassword
        ? 'Senha incorreta. A senha padrão para o primeiro acesso é: admin123'
        : 'Senha incorreta. Digite sua nova senha de administrador.',
      isDefaultPassword: db.isDefaultPassword,
    });
  });

  // Admin Auth Status check
  app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
    return res.json({
      isDefaultPassword: db.isDefaultPassword,
    });
  });

  // Change Admin Password
  app.post('/api/admin/change-password', (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 4 caracteres.' });
    }

    if (currentPassword !== db.adminPassword) {
      return res.status(401).json({ error: 'A senha atual informada está incorreta.' });
    }

    const trimmed = newPassword.trim();
    db.adminPassword = trimmed;
    db.isDefaultPassword = trimmed === 'admin123';

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Senha Alterada',
      badgeType: 'lock',
      details: db.isDefaultPassword
        ? 'Senha de administrador mantida/redefinida para a padrão (admin123).'
        : 'Senha de administrador alterada com sucesso para uma nova senha pessoal.',
    });

    broadcastState();
    return res.json({
      success: true,
      message: 'Senha de administrador alterada com sucesso!',
      isDefaultPassword: db.isDefaultPassword,
    });
  });

  // Create New Agent / Operator (Admin)
  app.post('/api/agents', (req: Request, res: Response) => {
    const { name, color, avatarBg, status, extension, dailyGoal, shift, role } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O nome do operador é obrigatório.' });
    }

    const defaultPalettes = [
      { color: '#3B82F6', avatarBg: 'bg-blue-600' },
      { color: '#10B981', avatarBg: 'bg-emerald-600' },
      { color: '#8B5CF6', avatarBg: 'bg-purple-600' },
      { color: '#F59E0B', avatarBg: 'bg-amber-600' },
      { color: '#EC4899', avatarBg: 'bg-pink-600' },
      { color: '#06B6D4', avatarBg: 'bg-cyan-600' },
      { color: '#6366F1', avatarBg: 'bg-indigo-600' },
      { color: '#14B8A6', avatarBg: 'bg-teal-600' },
    ];
    const palette = defaultPalettes[db.agents.length % defaultPalettes.length];

    const newAgent: Agent = {
      id: 'agent_' + Date.now().toString(36),
      name: name.trim(),
      color: color || palette.color,
      avatarBg: avatarBg || palette.avatarBg,
      status: (status as AgentStatus) || 'available',
      currentContactId: null,
      callsCount: 0,
      whatsappCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      extension: extension ? String(extension).trim() : '',
      dailyGoal: dailyGoal ? Math.max(1, Number(dailyGoal)) : 50,
      shift: shift || 'integral',
      role: role ? String(role).trim() : 'Atendente Comercial',
    };

    db.agents.push(newAgent);

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Novo Atendente Cadastrado',
      badgeType: 'info',
      details: `${newAgent.name} cadastrado na equipe (${newAgent.shift || 'Turno Integral'}, Meta: ${newAgent.dailyGoal || 50} ligações/dia).`,
    });

    broadcastState();
    return res.status(201).json({ success: true, agent: newAgent, agents: db.agents });
  });

  // Update Agent / Operator Details (Admin)
  app.put('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, color, avatarBg, status, extension, dailyGoal, shift, role } = req.body;
    const agent = db.agents.find((a) => a.id === id);

    if (!agent) {
      return res.status(404).json({ error: 'Operador não encontrado.' });
    }

    const oldName = agent.name;
    if (name && typeof name === 'string' && name.trim()) {
      agent.name = name.trim();
    }
    if (color) agent.color = color;
    if (avatarBg) agent.avatarBg = avatarBg;
    if (status) agent.status = status;
    if (extension !== undefined) agent.extension = String(extension).trim();
    if (dailyGoal !== undefined) agent.dailyGoal = Math.max(1, Number(dailyGoal));
    if (shift !== undefined) agent.shift = shift;
    if (role !== undefined) agent.role = String(role).trim();
    agent.lastActiveAt = Date.now();

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Atendente Atualizado',
      badgeType: 'info',
      details: oldName !== agent.name
        ? `Nome alterado de "${oldName}" para "${agent.name}".`
        : `Cadastro de ${agent.name} atualizado no painel do administrador.`,
    });

    broadcastState();
    return res.json({ success: true, agent, agents: db.agents });
  });

  // Reset Single Agent Today Metrics (Admin)
  app.post('/api/agents/:id/reset-metrics', (req: Request, res: Response) => {
    const { id } = req.params;
    const agent = db.agents.find((a) => a.id === id);

    if (!agent) {
      return res.status(404).json({ error: 'Atendente não encontrado.' });
    }

    agent.callsCount = 0;
    agent.whatsappCount = 0;
    agent.successCount = 0;

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Métricas Zeradas',
      badgeType: 'warning',
      details: `Métricas diárias de ${agent.name} foram reiniciadas pelo administrador.`,
    });

    broadcastState();
    return res.json({ success: true, agent, agents: db.agents });
  });

  // Delete Agent / Operator (Admin)
  app.delete('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const agentIndex = db.agents.findIndex((a) => a.id === id);

    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Operador não encontrado.' });
    }

    const agent = db.agents[agentIndex];

    // Release any contact currently locked by this agent back to queue
    db.contacts.forEach((c) => {
      if (c.lockedBy === agent.id) {
        c.lockedBy = null;
        c.lockedByName = null;
        c.lockedAt = null;
        if (c.status === 'in_progress') {
          c.status = 'pending';
        }
        c.updatedAt = Date.now();
      }
    });

    db.agents.splice(agentIndex, 1);

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Operador Desativado',
      badgeType: 'warning',
      details: `Operador ${agent.name} foi removido da equipe. Eventuais contatos em atendimento foram retornados para a fila.`,
    });

    broadcastState();
    return res.json({ success: true, deletedAgentId: id, agents: db.agents });
  });

  // Force Release Stuck Contact (Admin)
  app.post('/api/admin/force-release-contact', (req: Request, res: Response) => {
    const { contactId } = req.body;
    const contact = db.contacts.find((c) => c.id === contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado.' });
    }

    const prevOwner = contact.lockedByName || 'Operador';
    const agent = db.agents.find((a) => a.id === contact.lockedBy);

    contact.lockedBy = null;
    contact.lockedByName = null;
    contact.lockedAt = null;
    contact.status = 'pending';
    contact.updatedAt = Date.now();

    if (agent && agent.currentContactId === contact.id) {
      agent.currentContactId = null;
      agent.status = 'available';
      agent.lastActiveAt = Date.now();
    }

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      contactId: contact.id,
      contactName: contact.name,
      action: 'Desbloqueio Forçado por Admin',
      badgeType: 'warning',
      details: `Admin forçou a liberação do contato ${contact.name} (estava com ${prevOwner}). Retornado para a fila.`,
    });

    broadcastState();
    return res.json({ success: true, contact });
  });

  // Pull Next Available Contact (Atomic queue allocation)
  // Ensures: "o que uma pessoa atendeu a outra não atenda"
  app.post('/api/queue/pull-next', (req: Request, res: Response) => {
    const { agentId } = req.body;
    const agent = db.agents.find((a) => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Operador não encontrado' });
    }

    db.cleanupStaleLocks();

    // Check if agent already has an active locked contact
    const existing = db.contacts.find((c) => c.lockedBy === agentId && c.status === 'in_progress');
    if (existing) {
      agent.currentContactId = existing.id;
      agent.status = 'in_call';
      agent.lastActiveAt = Date.now();
      broadcastState();
      return res.json({ contact: existing, alreadyLocked: true });
    }

    // Find first unlocked pending contact
    const nextContact = db.contacts.find(
      (c) =>
        c.status === 'pending' &&
        (!c.lockedBy || (c.lockedAt && Date.now() - c.lockedAt > db.lockTimeoutMs))
    );

    if (!nextContact) {
      return res.status(404).json({ message: 'Nenhum contato pendente na fila.' });
    }

    // Atomically lock for this agent
    nextContact.lockedBy = agent.id;
    nextContact.lockedByName = agent.name;
    nextContact.lockedAt = Date.now();
    nextContact.status = 'in_progress';
    nextContact.updatedAt = Date.now();

    agent.currentContactId = nextContact.id;
    agent.status = 'in_call';
    agent.lastActiveAt = Date.now();

    db.addLog({
      agentId: agent.id,
      agentName: agent.name,
      contactId: nextContact.id,
      contactName: nextContact.name,
      action: 'Puxou da Fila',
      badgeType: 'lock',
      details: `Contato puxado por ${agent.name}. Bloqueado para os demais operadores.`,
    });

    broadcastState();
    return res.json({ contact: nextContact });
  });

  // Lock Specific Contact (Manual selection with anti-collision check)
  app.post('/api/queue/lock', (req: Request, res: Response) => {
    const { contactId, agentId } = req.body;
    const agent = db.agents.find((a) => a.id === agentId);
    const contact = db.contacts.find((c) => c.id === contactId);

    if (!agent || !contact) {
      return res.status(404).json({ error: 'Operador ou contato não encontrado' });
    }

    db.cleanupStaleLocks();

    // Anti-collision check!
    const isLockedByOther =
      contact.lockedBy &&
      contact.lockedBy !== agentId &&
      contact.lockedAt &&
      Date.now() - contact.lockedAt < db.lockTimeoutMs;

    if (isLockedByOther) {
      return res.status(409).json({
        error: `Este contato já foi assumido por ${contact.lockedByName || 'outro operador'}.`,
        lockedBy: contact.lockedBy,
        lockedByName: contact.lockedByName,
      });
    }

    // Lock successfully
    contact.lockedBy = agent.id;
    contact.lockedByName = agent.name;
    contact.lockedAt = Date.now();
    contact.status = 'in_progress';
    contact.updatedAt = Date.now();

    agent.currentContactId = contact.id;
    agent.status = 'in_call';
    agent.lastActiveAt = Date.now();

    db.addLog({
      agentId: agent.id,
      agentName: agent.name,
      contactId: contact.id,
      contactName: contact.name,
      action: 'Iniciou Atendimento',
      badgeType: 'lock',
      details: `${agent.name} iniciou atendimento com ${contact.name}.`,
    });

    broadcastState();
    return res.json({ success: true, contact });
  });

  // Release Locked Contact without final status (e.g. Cancel / Skip)
  app.post('/api/queue/release', (req: Request, res: Response) => {
    const { contactId, agentId, reason } = req.body;
    const contact = db.contacts.find((c) => c.id === contactId);
    const agent = db.agents.find((a) => a.id === agentId);

    if (contact && contact.lockedBy === agentId) {
      contact.lockedBy = null;
      contact.lockedByName = null;
      contact.lockedAt = null;
      contact.status = 'pending';
      contact.updatedAt = Date.now();
    }

    if (agent && agent.currentContactId === contactId) {
      agent.currentContactId = null;
      agent.status = 'available';
      agent.lastActiveAt = Date.now();
    }

    db.addLog({
      agentId: agentId || 'system',
      agentName: agent?.name || 'Operador',
      contactId: contact?.id,
      contactName: contact?.name,
      action: 'Liberou Contato',
      badgeType: 'warning',
      details: `Devolveu o contato à fila. Motivo: ${reason || 'Não informado'}.`,
    });

    broadcastState();
    return res.json({ success: true });
  });

  // Complete Call / WhatsApp & Mark Status
  app.post('/api/queue/complete', (req: Request, res: Response) => {
    const {
      contactId,
      agentId,
      status,
      notes,
      actionType, // 'call' | 'whatsapp'
      callDurationSeconds,
    } = req.body;

    const contact = db.contacts.find((c) => c.id === contactId);
    const agent = db.agents.find((a) => a.id === agentId);

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const validStatus: ContactStatus = status || 'answered';
    const duration = Number(callDurationSeconds) || 0;

    contact.status = validStatus;
    contact.notes = notes || contact.notes;
    contact.callDurationSeconds = (contact.callDurationSeconds || 0) + duration;
    contact.lastOutcome = validStatus;
    contact.lastContactedAt = Date.now();
    contact.updatedAt = Date.now();

    // Release lock so it's completed
    contact.lockedBy = null;
    contact.lockedByName = null;
    contact.lockedAt = null;

    // Add to history
    contact.history.unshift({
      id: 'hist-' + Date.now(),
      timestamp: Date.now(),
      agentId: agent?.id || 'unknown',
      agentName: agent?.name || 'Operador',
      action: actionType === 'whatsapp' ? 'whatsapp' : 'call',
      status: validStatus,
      notes: notes || '',
      durationSeconds: duration,
    });

    // Update agent metrics
    if (agent) {
      if (actionType === 'whatsapp') {
        agent.whatsappCount += 1;
      } else {
        agent.callsCount += 1;
      }

      if (['answered', 'interested', 'scheduled'].includes(validStatus)) {
        agent.successCount += 1;
      }

      agent.currentContactId = null;
      agent.status = 'available';
      agent.lastActiveAt = Date.now();
    }

    db.addLog({
      agentId: agent?.id || 'unknown',
      agentName: agent?.name || 'Operador',
      contactId: contact.id,
      contactName: contact.name,
      action: actionType === 'whatsapp' ? 'WhatsApp Registrado' : 'Chamada Finalizada',
      badgeType: ['answered', 'interested'].includes(validStatus)
        ? 'success'
        : validStatus === 'whatsapp_sent'
          ? 'whatsapp'
          : 'call',
      details: `Status: [${validStatus}] - ${notes ? `"${notes.substring(0, 40)}..."` : 'Sem observações'}`,
    });

    // Webhook notification to external CRM
    triggerCrmWebhook('contact.updated', {
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      company: contact.company,
      email: contact.email,
      status: contact.status,
      notes: contact.notes,
      callDurationSeconds: duration,
      agentId: agent?.id,
      agentName: agent?.name,
      lastContactedAt: new Date(contact.lastContactedAt!).toISOString(),
    });

    broadcastState();
    return res.json({ success: true, contact });
  });

  // Batch Import Contacts (CSV or JSON)
  app.post('/api/queue/import', (req: Request, res: Response) => {
    const { contacts: incomingContacts, mode } = req.body; // mode: 'append' | 'replace'

    if (!Array.isArray(incomingContacts) || incomingContacts.length === 0) {
      return res.status(400).json({ error: 'Nenhum contato enviado para importação' });
    }

    const formatted: Contact[] = incomingContacts.map((c, index) => {
      const rawPhone = String(c.phone || c.telefone || c.celular || '');
      const cleanPhone = sanitizePhone(rawPhone);
      return {
        id: 'ct-' + Date.now() + '-' + index,
        name: String(c.name || c.nome || 'Contato sem nome').trim(),
        phone: formatPhoneDisplay(rawPhone),
        cleanPhone: cleanPhone,
        company: String(c.company || c.empresa || '').trim(),
        email: String(c.email || '').trim(),
        status: 'pending',
        notes: String(c.notes || c.observacao || c.obs || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [
          {
            id: 'hist-init-' + index,
            timestamp: Date.now(),
            agentId: 'system',
            agentName: 'Importação',
            action: 'crm_sync',
            notes: 'Importado para a fila de discagem',
          },
        ],
      };
    });

    if (mode === 'replace') {
      db.contacts = formatted;
    } else {
      db.contacts = [...db.contacts, ...formatted];
    }

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Importação de Lista',
      badgeType: 'info',
      details: `${formatted.length} contatos importados (${mode === 'replace' ? 'Substituição total' : 'Adicionados à fila'}).`,
    });

    broadcastState();
    return res.json({ success: true, count: formatted.length, total: db.contacts.length });
  });

  // Export Contacts
  app.get('/api/queue/export', (_req: Request, res: Response) => {
    res.json({
      exportedAt: new Date().toISOString(),
      total: db.contacts.length,
      contacts: db.contacts,
    });
  });

  // Reset / Clear Queue
  app.post('/api/queue/reset-sample', (_req: Request, res: Response) => {
    db.contacts = initialContacts.map((c) => ({
      ...c,
      id: 'ct-' + Math.random().toString(36).substring(2, 8),
      status: 'pending',
      lockedBy: null,
      lockedByName: null,
      lockedAt: null,
      notes: '',
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    db.agents = initialAgents.map((a) => ({
      ...a,
      status: 'available',
      currentContactId: null,
      callsCount: 0,
      whatsappCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
    }));

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Reset de Demonstração',
      badgeType: 'info',
      details: 'Fila e agentes resetados com dados de teste padrão.',
    });

    broadcastState();
    return res.json({ success: true, count: db.contacts.length });
  });

  // Clear all or only completed
  app.delete('/api/queue/clear', (req: Request, res: Response) => {
    const { target } = req.body; // 'all' | 'completed'
    if (target === 'completed') {
      db.contacts = db.contacts.filter((c) => ['pending', 'in_progress'].includes(c.status));
    } else {
      db.contacts = [];
    }

    db.addLog({
      agentId: 'admin',
      agentName: 'Administrador',
      action: 'Limpeza de Fila',
      badgeType: 'warning',
      details: target === 'completed' ? 'Contatos concluídos removidos.' : 'Todos os contatos foram limpos.',
    });

    broadcastState();
    return res.json({ success: true, remaining: db.contacts.length });
  });

  // Update CRM Config (Webhook URL or API Key)
  app.post('/api/crm/config', (req: Request, res: Response) => {
    const { webhookUrl, regenerateKey } = req.body;
    if (typeof webhookUrl === 'string') {
      db.crmWebhookUrl = webhookUrl.trim();
    }
    if (regenerateKey) {
      db.crmApiKey = 'fd_live_sk_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    }
    broadcastState();
    return res.json({
      success: true,
      apiKey: db.crmApiKey,
      webhookUrl: db.crmWebhookUrl,
    });
  });

  // Test Webhook Dispatch
  app.post('/api/crm/test-webhook', async (_req: Request, res: Response) => {
    if (!db.crmWebhookUrl) {
      return res.status(400).json({ error: 'Nenhuma URL de webhook configurada' });
    }
    await triggerCrmWebhook('test.ping', {
      message: 'Teste de conectividade FilaDial -> CRM externo',
      timestamp: new Date().toISOString(),
      activeAgents: db.agents.filter((a) => a.status !== 'offline').length,
      queueSize: db.contacts.length,
    });
    return res.json({ success: true, message: 'Ping enviado com sucesso!' });
  });

  // --- EXTERNAL CRM INTEGRATION REST API ---
  // Middleware to validate API key
  const validateCrmAuth = (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization || req.headers['x-api-key'];
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token !== db.crmApiKey) {
      return res.status(401).json({
        error: 'Não autorizado. Envie o cabeçalho Authorization: Bearer <API_KEY> ou X-API-Key: <API_KEY>',
      });
    }
    next();
  };

  // External CRM: POST /api/crm/contacts - Ingest Leads from HubSpot, RD Station, ActiveCampaign
  app.post('/api/crm/contacts', validateCrmAuth, (req: Request, res: Response) => {
    const body = req.body;
    const leads = Array.isArray(body) ? body : [body];

    if (leads.length === 0) {
      return res.status(400).json({ error: 'Payload vazio' });
    }

    const created: Contact[] = [];
    for (const lead of leads) {
      const rawPhone = String(lead.phone || lead.telefone || lead.celular || '');
      if (!rawPhone) continue;

      const cleanPhone = sanitizePhone(rawPhone);
      const newContact: Contact = {
        id: 'crm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: String(lead.name || lead.nome || 'Lead do CRM').trim(),
        phone: formatPhoneDisplay(rawPhone),
        cleanPhone: cleanPhone,
        company: String(lead.company || lead.empresa || '').trim(),
        email: String(lead.email || '').trim(),
        status: 'pending',
        notes: String(lead.notes || lead.observacao || '').trim(),
        customFields: lead.customFields || {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [
          {
            id: 'hist-crm-' + Date.now(),
            timestamp: Date.now(),
            agentId: 'crm_api',
            agentName: 'API Externa (CRM)',
            action: 'crm_sync',
            notes: 'Lead injetado via API de CRM externo',
          },
        ],
      };
      db.contacts.unshift(newContact);
      created.push(newContact);
    }

    db.addLog({
      agentId: 'crm_api',
      agentName: 'API Externa',
      action: 'Ingestão de Leads CRM',
      badgeType: 'info',
      details: `${created.length} lead(s) recebidos via API externa de CRM.`,
    });

    broadcastState();
    return res.status(201).json({
      success: true,
      message: `${created.length} lead(s) adicionados à fila`,
      contacts: created,
    });
  });

  // External CRM: GET /api/crm/contacts - Query contacts & their statuses
  app.get('/api/crm/contacts', validateCrmAuth, (req: Request, res: Response) => {
    const { status, limit } = req.query;
    let list = db.contacts;
    if (status && typeof status === 'string') {
      list = list.filter((c) => c.status === status);
    }
    const maxLimit = limit ? Math.min(Number(limit) || 100, 500) : 100;
    return res.json({
      total: list.length,
      contacts: list.slice(0, maxLimit),
    });
  });

  // External CRM: GET /api/crm/contacts/:id - Query single contact status & history
  app.get('/api/crm/contacts/:id', validateCrmAuth, (req: Request, res: Response) => {
    const contact = db.contacts.find((c) => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    return res.json({ contact });
  });

  // --- VITE & STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FilaDial server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
