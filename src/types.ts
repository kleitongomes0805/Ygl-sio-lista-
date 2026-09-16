export type ContactStatus =
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

export interface ContactHistoryItem {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  action: 'call' | 'whatsapp' | 'status_change' | 'note' | 'crm_sync';
  status?: ContactStatus;
  notes?: string;
  durationSeconds?: number;
}

export interface Contact {
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

export type AgentStatus = 'available' | 'in_call' | 'in_whatsapp' | 'paused' | 'offline';

export interface Agent {
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
  shift?: 'manha' | 'tarde' | 'integral' | 'noite';
}

export interface QueueStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  answeredCount: number;
  whatsappCount: number;
  conversionRate: number;
}

export interface ActivityLog {
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

export interface WhatsAppTemplate {
  id: string;
  title: string;
  text: string;
  category: 'intro' | 'unanswered' | 'proposal' | 'scheduling' | 'custom';
}

export interface WorkgroupConfig {
  name: string;
  clientName: string;
  password?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ServerState {
  contacts: Contact[];
  agents: Agent[];
  stats: QueueStats;
  recentLogs: ActivityLog[];
  apiKey: string;
  webhookUrl?: string;
  isDefaultPassword?: boolean;
  workgroup?: WorkgroupConfig;
}

