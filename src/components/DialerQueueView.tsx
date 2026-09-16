import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  MessageCircle,
  Clock,
  User,
  Building,
  Mail,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  ArrowRight,
  Send,
  Sparkles,
  ShieldCheck,
  Timer,
  FileText,
  Volume2,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Contact, Agent, ContactStatus, WhatsAppTemplate } from '../types';
import { defaultWhatsAppTemplates } from '../data/whatsappTemplates';
import { getStatusBadgeClass, getStatusLabel, formatSecondsToTimer } from '../utils/formatters';

interface DialerQueueViewProps {
  currentAgent: Agent | undefined;
  isSupervisor: boolean;
  contacts: Contact[];
  agents: Agent[];
  onPullNext: () => Promise<void>;
  onLockContact: (contactId: string) => Promise<void>;
  onReleaseContact: (contactId: string, reason?: string) => Promise<void>;
  onCompleteContact: (params: {
    contactId: string;
    status: ContactStatus;
    notes: string;
    actionType: 'call' | 'whatsapp';
    callDurationSeconds: number;
  }) => Promise<void>;
  onAgentStatusChange: (status: Agent['status']) => void;
  onSelectAgent: (agentId: string) => void;
  isLoading: boolean;
}

export const DialerQueueView: React.FC<DialerQueueViewProps> = ({
  currentAgent,
  isSupervisor,
  contacts,
  agents,
  onPullNext,
  onLockContact,
  onReleaseContact,
  onCompleteContact,
  onAgentStatusChange,
  onSelectAgent,
  isLoading,
}) => {
  // Find current active locked contact for this agent
  const activeContact = currentAgent
    ? contacts.find((c) => c.lockedBy === currentAgent.id && c.status === 'in_progress')
    : null;

  // Active call state
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const callTimerRef = useRef<number | null>(null);

  // Status and notes form
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus>('answered');
  const [notes, setNotes] = useState<string>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [autoPullNext, setAutoPullNext] = useState<boolean>(true);

  // WhatsApp form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-1');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Reset form when contact changes
  useEffect(() => {
    if (activeContact) {
      setNotes(activeContact.notes || '');
      setSelectedStatus('answered');
      setIsInCall(false);
      setCallSeconds(0);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Populate default template
      const tpl = defaultWhatsAppTemplates[0];
      const rendered = renderMessage(tpl.text, activeContact, currentAgent?.name || 'Operador');
      setCustomMessage(rendered);
    } else {
      setIsInCall(false);
      setCallSeconds(0);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
  }, [activeContact?.id]);

  // Call timer effect
  useEffect(() => {
    if (isInCall) {
      callTimerRef.current = window.setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isInCall]);

  // Replace placeholders in templates
  function renderMessage(text: string, contact: Contact, agentName: string): string {
    return text
      .replace(/{nome}/g, contact.name.split(' ')[0] || contact.name)
      .replace(/{empresa}/g, contact.company || 'sua empresa')
      .replace(/{operador}/g, agentName)
      .replace(/{telefone}/g, contact.phone);
  }

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = defaultWhatsAppTemplates.find((t) => t.id === templateId);
    if (tpl && activeContact) {
      const rendered = renderMessage(tpl.text, activeContact, currentAgent?.name || 'Operador');
      setCustomMessage(rendered);
    }
  };

  // Trigger Phone Call
  const handleStartCall = () => {
    if (!activeContact) return;
    setIsInCall(true);
    // Trigger native tel protocol
    window.location.href = `tel:${activeContact.cleanPhone}`;
  };

  const handleEndCall = () => {
    setIsInCall(false);
  };

  // Trigger WhatsApp Web / App
  const handleOpenWhatsApp = (useWeb: boolean = false) => {
    if (!activeContact) return;
    const encoded = encodeURIComponent(customMessage);
    const waUrl = useWeb
      ? `https://web.whatsapp.com/send?phone=${activeContact.cleanPhone}&text=${encoded}`
      : `https://wa.me/${activeContact.cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setSelectedStatus('whatsapp_sent');
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Save Outcome & Mark Status
  const handleSaveOutcome = async (actionType: 'call' | 'whatsapp') => {
    if (!activeContact) return;

    let finalNotes = notes.trim();
    if (selectedStatus === 'scheduled' && rescheduleDate) {
      finalNotes = `[Reagendado para: ${new Date(rescheduleDate).toLocaleString('pt-BR')}] ${finalNotes}`;
    }

    await onCompleteContact({
      contactId: activeContact.id,
      status: selectedStatus,
      notes: finalNotes,
      actionType,
      callDurationSeconds: callSeconds,
    });

    if (autoPullNext) {
      setTimeout(() => {
        onPullNext();
      }, 300);
    }
  };

  // Available upcoming contacts in queue
  const pendingQueue = contacts.filter((c) => c.status === 'pending');
  const lockedByOthers = contacts.filter(
    (c) => c.status === 'in_progress' && c.lockedBy && c.lockedBy !== currentAgent?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner if Supervisor */}
      {isSupervisor && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Você está em modo Supervisor / Administrador
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Para fazer ligações como um dos 5 operadores simultâneos e testar a prevenção de
                conflito, selecione um operador abaixo:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {agents.map((ag) => (
              <button
                key={ag.id}
                onClick={() => onSelectAgent(ag.id)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition-colors"
              >
                Assumir {ag.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operator Status & Mini-Metrics Bar */}
      {currentAgent && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${currentAgent.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-sm`}
            >
              {currentAgent.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentAgent.name}
                </span>
                <span className="text-xs text-slate-500">({currentAgent.id.replace('_', ' ')})</span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    currentAgent.status === 'in_call'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : currentAgent.status === 'paused'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentAgent.status === 'in_call' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                    }`}
                  />
                  {currentAgent.status === 'in_call'
                    ? 'Em Atendimento'
                    : currentAgent.status === 'paused'
                      ? 'Em Pausa'
                      : 'Disponível'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operador 1 de 5 ativos na equipe simultânea
              </p>
            </div>
          </div>

          {/* Quick Metrics of current operator */}
          <div className="flex items-center gap-3 sm:gap-6 text-xs w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-700">
            <div className="text-center">
              <span className="text-[11px] text-slate-500 block">Chamadas Feitas</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
                {currentAgent.callsCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-slate-500 block">WhatsApps</span>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                {currentAgent.whatsappCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-slate-500 block">Sucesso / Conversão</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {currentAgent.successCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  onAgentStatusChange(currentAgent.status === 'paused' ? 'available' : 'paused')
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  currentAgent.status === 'paused'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {currentAgent.status === 'paused' ? 'Retomar Trabalho' : 'Pausar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dialing Workspace: ACTIVE CONTACT vs PULL NEXT */}
      {activeContact ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center: Active Contact Card & Quick Dial / WhatsApp */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Details Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-500/80 shadow-md p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bloqueado Exclusivamente para Você</span>
              </div>

              {/* Contact Header */}
              <div className="flex items-start gap-4 mb-5 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                  {activeContact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                    {activeContact.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                    {activeContact.company && (
                      <span className="inline-flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {activeContact.company}
                      </span>
                    )}
                    {activeContact.email && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {activeContact.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Big Phone Number Display */}
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between mb-6">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Número de Contato:
                  </span>
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {activeContact.phone}
                  </span>
                </div>
                {isInCall && (
                  <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300">
                    <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="font-mono font-bold text-sm">
                      {formatSecondsToTimer(callSeconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON 1: LIGAR AGORA */}
              {/* ACTION BUTTON 2: WHATSAPP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                {/* Ligar Button */}
                {!isInCall ? (
                  <button
                    id="btn-call-now"
                    onClick={handleStartCall}
                    className="flex items-center justify-center gap-3 py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-5 h-5 text-white animate-bounce" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-extrabold block">Ligar Agora</span>
                      <span className="text-[10px] text-blue-100 font-normal">
                        Discar via telefone/softphone
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    id="btn-end-call"
                    onClick={handleEndCall}
                    className="flex items-center justify-center gap-3 py-4 px-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                      <PhoneOff className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-extrabold block">Encerrar Chamada</span>
                      <span className="text-[10px] text-rose-100 font-mono">
                        Duração: {formatSecondsToTimer(callSeconds)}
                      </span>
                    </div>
                  </button>
                )}

                {/* WhatsApp Button */}
                <div className="flex gap-2">
                  <button
                    id="btn-whatsapp-now"
                    onClick={() => handleOpenWhatsApp(false)}
                    className="flex-1 flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer group"
                    title="Conversar no WhatsApp via wa.me"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-extrabold block">Conversar no WhatsApp</span>
                      <span className="text-[10px] text-emerald-100 font-normal">
                        Abrir conversa direta (wa.me)
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(true)}
                    className="px-3 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm text-[11px]"
                    title="Abrir no WhatsApp Web (Navegador)"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-[9px] uppercase font-bold">Web</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Message Template Preview & Customizer */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Modelo de Mensagem WhatsApp:
                  </span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {defaultWhatsAppTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/40 font-sans"
                    placeholder="Mensagem para enviar no WhatsApp..."
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-slate-400">
                      Variáveis preenchidas automaticamente: Nome, Empresa e Operador
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    >
                      {copiedMessage ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar Texto
                        </>
                      )}
                    </button>
                  </div>

                  {/* Direct button to start WhatsApp conversation with this template */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Conversar no WhatsApp com este texto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(true)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no WhatsApp Web</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel / Release back to queue */}
            <div className="flex justify-between items-center px-1">
              <button
                onClick={() => onReleaseContact(activeContact.id, 'Operador cancelou atendimento')}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium underline underline-offset-4"
              >
                Devolver contato à fila sem registrar status (Desistir)
              </button>
              <span className="text-xs text-slate-400">
                Anti-conflito: Contato será liberado instantaneamente para outros atendentes
              </span>
            </div>
          </div>

          {/* Right: Outcome / Status Registration */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Registrar Status do Atendimento</span>
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Selecione o desfecho da chamada ou mensagem para atualizar o status e salvar na lista
                exportável:
              </p>

              {/* Status Outcome Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Positive Outcomes */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('answered')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'answered'
                      ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>✅ Atendido / Em Conversa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('interested')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'interested'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>🤝 Interessado / Fechou</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('whatsapp_sent')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'whatsapp_sent'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>💬 WhatsApp Enviado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('scheduled')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'scheduled'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>📅 Reagendar Retorno</span>
                </button>

                {/* Negative / No Answer Outcomes */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('unanswered')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'unanswered'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-rose-400'
                  }`}
                >
                  <PhoneOff className="w-4 h-4 shrink-0" />
                  <span>📵 Não Atende</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('busy')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'busy'
                      ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-400'
                  }`}
                >
                  <Timer className="w-4 h-4 shrink-0" />
                  <span>⏳ Ocupado / Caixa Postal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('not_interested')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'not_interested'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>❌ Sem Interesse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('wrong_number')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    selectedStatus === 'wrong_number'
                      ? 'bg-gray-800 text-white border-gray-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-gray-500'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>🚫 Número Inválido</span>
                </button>
              </div>

              {/* Reschedule Date input if scheduled */}
              {selectedStatus === 'scheduled' && (
                <div className="mb-4 bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                    Data e Hora do Retorno:
                  </label>
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Notes input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Histórico:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cliente pediu retorno amanhã às 14h; interessado no plano anual..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Auto Pull Next Checkbox */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="checkbox"
                  id="auto-pull"
                  checked={autoPullNext}
                  onChange={(e) => setAutoPullNext(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label
                  htmlFor="auto-pull"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Puxar automaticamente o próximo lead da fila após salvar
                </label>
              </div>

              {/* Save Buttons */}
              <div className="space-y-2">
                <button
                  id="btn-save-and-next"
                  onClick={() => handleSaveOutcome(isInCall ? 'call' : 'whatsapp')}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Status & Concluir Lead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* NO ACTIVE CONTACT -> PULL NEXT FROM QUEUE */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <PhoneCall className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pronto para a Próxima Chamada?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Existem{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {pendingQueue.length} contatos aguardando
              </strong>{' '}
              na fila. Ao puxar, o lead é travado exclusivamente para você no servidor para que
              nenhum outro operador ligue para a mesma pessoa.
            </p>
          </div>

          {/* Action Buttons: Pull Next & Direct WhatsApp */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-pull-next"
              onClick={onPullNext}
              disabled={isLoading || pendingQueue.length === 0}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Alocando da Fila...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5" />
                  <span>Puxar Próximo da Fila</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {pendingQueue.length > 0 && (
              <a
                href={`https://wa.me/${pendingQueue[0].cleanPhone}?text=${encodeURIComponent(
                  `Olá ${pendingQueue[0].name.split(' ')[0]}, tudo bem? Sou da equipe de atendimento.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
                title="Iniciar conversa no WhatsApp com o primeiro contato da fila"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Conversar no WhatsApp</span>
              </a>
            )}
          </div>

          {pendingQueue.length === 0 && (
            <p className="text-xs text-amber-600 font-medium">
              Todos os contatos da fila foram concluídos! Vá até a aba "Importar / Exportar" para
              adicionar mais contatos ou recarregar os dados de demonstração.
            </p>
          )}

          {/* Quick Preview of Upcoming Leads in Queue */}
          {pendingQueue.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 text-left">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Próximos Leads na Fila ({pendingQueue.length}):
              </h5>
              <div className="space-y-2">
                {pendingQueue.slice(0, 5).map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {c.phone} {c.company ? `• ${c.company}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://wa.me/${c.cleanPhone}?text=${encodeURIComponent(
                          `Olá ${c.name.split(' ')[0]}, tudo bem? Sou da equipe de atendimento.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        onClick={() => onLockContact(c.id)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        Puxar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Simultaneous Dialers Monitor Strip */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Operadores Simultâneos Conectados (Até 5 Pessoas):
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            {lockedByOthers.length} chamada(s) ativas no momento
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {agents.map((ag) => {
            const isMe = currentAgent?.id === ag.id;
            const currentAttending = contacts.find(
              (c) => c.lockedBy === ag.id && c.status === 'in_progress'
            );

            return (
              <div
                key={ag.id}
                className={`p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full ${ag.avatarBg} text-white text-[10px] font-bold flex items-center justify-center`}
                    >
                      {ag.name.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[90px]">
                      {ag.name.split(' ')[0]}
                    </span>
                  </div>
                  {isMe && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      Você
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {currentAttending ? (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <PhoneCall className="w-3 h-3 animate-pulse" />
                        Em Atendimento:
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                        {currentAttending.name}
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Disponível / Na Fila</span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{ag.callsCount} chamadas</span>
                  <span className="font-bold text-emerald-600">{ag.successCount} vendas</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
