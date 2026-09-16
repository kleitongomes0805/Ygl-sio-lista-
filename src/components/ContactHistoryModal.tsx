import React from 'react';
import {
  X,
  History,
  PhoneCall,
  Phone,
  MessageCircle,
  Clock,
  User,
  Building,
  Mail,
  Shield,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Contact } from '../types';
import { getStatusBadgeClass, getStatusLabel, formatSecondsToTimer } from '../utils/formatters';

interface ContactHistoryModalProps {
  contact: Contact | null;
  onClose: () => void;
}

export const ContactHistoryModal: React.FC<ContactHistoryModalProps> = ({ contact, onClose }) => {
  if (!contact) return null;

  const badge = getStatusBadgeClass(contact.status);
  const waUrl = `https://wa.me/${contact.cleanPhone}?text=${encodeURIComponent(
    `Olá ${contact.name.split(' ')[0]}, tudo bem? Sou da equipe de atendimento.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {contact.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{contact.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{contact.phone}</span>
                {contact.company && <span>• {contact.company}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Conversar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Status Atual do Contato:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                {getStatusLabel(contact.status)}
              </span>
            </div>

            {contact.callDurationSeconds ? (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block mb-0.5">Tempo em Chamada:</span>
                <span className="font-mono font-bold text-sm text-blue-600">
                  {formatSecondsToTimer(contact.callDurationSeconds)}
                </span>
              </div>
            ) : null}
          </div>

          {contact.notes && (
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Última Observação Registrada:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{contact.notes}</p>
            </div>
          )}

          {/* Timeline of History */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Histórico de Ações ({contact.history?.length || 0})</span>
            </h4>

            {contact.history && contact.history.length > 0 ? (
              <div className="space-y-2.5 border-l-2 border-slate-200 dark:border-slate-700 ml-2 pl-4">
                {contact.history.map((h, i) => (
                  <div key={h.id || i} className="relative space-y-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-800" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {h.agentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(h.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Ação: <strong className="capitalize">{h.action}</strong>
                      {h.status ? ` • Status: ${getStatusLabel(h.status)}` : ''}
                      {h.durationSeconds ? ` (${formatSecondsToTimer(h.durationSeconds)})` : ''}
                    </div>
                    {h.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                        "{h.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Nenhuma ação anterior registrada.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Conversar no WhatsApp</span>
            </a>
            <a
              href={`tel:${contact.cleanPhone}`}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Ligar</span>
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
