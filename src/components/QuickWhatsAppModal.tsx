import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  ExternalLink,
  Send,
  Sparkles,
  Phone,
  User,
  Check,
  Copy,
} from 'lucide-react';
import { Contact } from '../types';
import { defaultWhatsAppTemplates } from '../data/whatsappTemplates';

interface QuickWhatsAppModalProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultName?: string;
}

export const QuickWhatsAppModal: React.FC<QuickWhatsAppModalProps> = ({
  contacts,
  isOpen,
  onClose,
  defaultPhone = '',
  defaultName = '',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [leadName, setLeadName] = useState(defaultName);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('contact_first');
  const [customMessage, setCustomMessage] = useState<string>(
    'Olá! Tudo bem? Estou entrando em contato referente ao seu interesse em nossas soluções. Como posso te ajudar hoje?'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Clean phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const formattedForWhatsApp = cleanPhone.startsWith('55')
    ? cleanPhone
    : cleanPhone.length >= 10
      ? `55${cleanPhone}`
      : cleanPhone;

  const handleSelectContact = (contactId: string) => {
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setPhoneNumber(found.phone);
      setLeadName(found.name);
      const tpl = defaultWhatsAppTemplates.find((t) => t.id === selectedTemplateId);
      const text = tpl
        ? tpl.text
            .replace(/{nome}/g, found.name.split(' ')[0])
            .replace(/{empresa}/g, found.company || 'sua empresa')
            .replace(/{operador}/g, 'Equipe de Atendimento')
        : customMessage;
      setCustomMessage(text);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = defaultWhatsAppTemplates.find((t) => t.id === templateId);
    if (tpl) {
      const nameToUse = leadName.split(' ')[0] || 'Cliente';
      const text = tpl.text
        .replace(/{nome}/g, nameToUse)
        .replace(/{empresa}/g, 'sua empresa')
        .replace(/{operador}/g, 'Equipe de Atendimento');
      setCustomMessage(text);
    }
  };

  const handleOpenWhatsApp = (useWeb: boolean = false) => {
    if (!formattedForWhatsApp) return;
    const encoded = encodeURIComponent(customMessage);
    const url = useWeb
      ? `https://web.whatsapp.com/send?phone=${formattedForWhatsApp}&text=${encoded}`
      : `https://wa.me/${formattedForWhatsApp}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Conversa Direta no WhatsApp
              </h3>
              <p className="text-xs text-emerald-100">
                Inicie uma conversa no WhatsApp com qualquer número ou lead da fila
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Select from Queue */}
          {contacts.length > 0 && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Ou selecione um lead da lista:
              </label>
              <select
                onChange={(e) => handleSelectContact(e.target.value)}
                defaultValue=""
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="" disabled>
                  -- Escolha um lead para preencher automaticamente --
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Número de WhatsApp:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="(11) 99999-9999 ou 5511..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 pl-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome do Lead (opcional):
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full p-2.5 pl-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Modelo de Mensagem Pronta:</span>
              </label>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mb-2"
            >
              {defaultWhatsAppTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Digite sua mensagem para o WhatsApp..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            <div className="flex items-center justify-end mt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => handleOpenWhatsApp(false)}
            disabled={!cleanPhone}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Conversar no WhatsApp</span>
          </button>

          <button
            onClick={() => handleOpenWhatsApp(true)}
            disabled={!cleanPhone}
            className="w-full sm:w-auto py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            title="Abrir no WhatsApp Web para computador"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>WhatsApp Web</span>
          </button>
        </div>
      </div>
    </div>
  );
};
