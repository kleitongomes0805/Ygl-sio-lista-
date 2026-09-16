import { ContactStatus } from '../types';

export function getStatusLabel(status: ContactStatus): string {
  switch (status) {
    case 'pending':
      return 'Na Fila';
    case 'in_progress':
      return 'Em Atendimento';
    case 'answered':
      return 'Atendido';
    case 'interested':
      return 'Interessado / Venda';
    case 'scheduled':
      return 'Reagendado';
    case 'unanswered':
      return 'Não Atende';
    case 'busy':
      return 'Ocupado';
    case 'voicemail':
      return 'Caixa Postal';
    case 'whatsapp_sent':
      return 'WhatsApp Enviado';
    case 'not_interested':
      return 'Sem Interesse';
    case 'wrong_number':
      return 'Número Inválido';
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: ContactStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'in_progress':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'answered':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'interested':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'scheduled':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
      };
    case 'whatsapp_sent':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        dot: 'bg-teal-500',
      };
    case 'unanswered':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'busy':
    case 'voicemail':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    case 'not_interested':
    case 'wrong_number':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-400',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Nunca';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function formatSecondsToTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function exportToCsv(contacts: any[], filename = 'filadial-relatorio-contatos.csv') {
  const headers = [
    'ID',
    'Nome',
    'Telefone',
    'Telefone Limpo',
    'Empresa',
    'Email',
    'Status Final',
    'Status Descritivo',
    'Duração Chamada (segundos)',
    'Último Contato Em',
    'Observações',
    'Histórico de Ações',
  ];

  const rows = contacts.map((c) => [
    `"${c.id || ''}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${c.phone || ''}"`,
    `"${c.cleanPhone || ''}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${c.email || ''}"`,
    `"${c.status || ''}"`,
    `"${getStatusLabel(c.status)}"`,
    c.callDurationSeconds || 0,
    c.lastContactedAt ? `"${new Date(c.lastContactedAt).toLocaleString('pt-BR')}"` : '""',
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${((c.history || []).map((h: any) => `[${new Date(h.timestamp).toLocaleTimeString('pt-BR')}] ${h.agentName}: ${h.action} (${h.status || ''})`).join('; ')).replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
