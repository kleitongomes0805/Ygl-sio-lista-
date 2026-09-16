import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Phone,
  Target,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Agent, AgentStatus } from '../types';

export interface AgentFormData {
  id?: string;
  name: string;
  color: string;
  avatarBg: string;
  status: AgentStatus;
  role?: string;
  extension?: string;
  dailyGoal?: number;
  shift?: 'manha' | 'tarde' | 'integral' | 'noite';
}

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentData: AgentFormData) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>;
  agentToEdit?: Agent | null;
}

const colorOptions = [
  { name: 'Azul Real', color: '#3B82F6', avatarBg: 'bg-blue-600' },
  { name: 'Verde Esmeralda', color: '#10B981', avatarBg: 'bg-emerald-600' },
  { name: 'Roxo Violeta', color: '#8B5CF6', avatarBg: 'bg-purple-600' },
  { name: 'Âmbar Dourado', color: '#F59E0B', avatarBg: 'bg-amber-600' },
  { name: 'Rosa Magenta', color: '#EC4899', avatarBg: 'bg-pink-600' },
  { name: 'Ciano Oceano', color: '#06B6D4', avatarBg: 'bg-cyan-600' },
  { name: 'Índigo Noturno', color: '#6366F1', avatarBg: 'bg-indigo-600' },
  { name: 'Teal Moderno', color: '#14B8A6', avatarBg: 'bg-teal-600' },
];

const rolePresets = [
  'Atendente Comercial',
  'Operador de Vendas (Closer)',
  'Pré-Vendedor (SDR)',
  'Recuperador de Leads',
  'Suporte ao Cliente',
];

const shiftOptions: { id: 'manha' | 'tarde' | 'integral' | 'noite'; label: string; desc: string }[] = [
  { id: 'integral', label: 'Integral', desc: '09:00 às 18:00' },
  { id: 'manha', label: 'Manhã', desc: '08:00 às 14:00' },
  { id: 'tarde', label: 'Tarde', desc: '14:00 às 20:00' },
  { id: 'noite', label: 'Noite', desc: '18:00 às 00:00' },
];

export const OperatorModal: React.FC<OperatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  agentToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Atendente Comercial');
  const [extension, setExtension] = useState('');
  const [dailyGoal, setDailyGoal] = useState<number>(50);
  const [shift, setShift] = useState<'manha' | 'tarde' | 'integral' | 'noite'>('integral');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [status, setStatus] = useState<AgentStatus>('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name || '');
      setRole(agentToEdit.role || 'Atendente Comercial');
      setExtension(agentToEdit.extension || '');
      setDailyGoal(agentToEdit.dailyGoal || 50);
      setShift(agentToEdit.shift || 'integral');
      setStatus(agentToEdit.status || 'available');
      const found = colorOptions.find((c) => c.color === agentToEdit.color);
      if (found) setSelectedColor(found);
      else setSelectedColor({ name: 'Personalizado', color: agentToEdit.color, avatarBg: agentToEdit.avatarBg });
    } else {
      setName('');
      setRole('Atendente Comercial');
      setExtension('');
      setDailyGoal(50);
      setShift('integral');
      setStatus('available');
      setSelectedColor(colorOptions[0]);
    }
    setError(null);
  }, [agentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, digite o nome completo do atendente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        id: agentToEdit?.id,
        name: name.trim(),
        role: role.trim() || 'Atendente Comercial',
        extension: extension.trim(),
        dailyGoal: Number(dailyGoal) || 50,
        shift,
        color: selectedColor.color,
        avatarBg: selectedColor.avatarBg,
        status,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar dados do atendente';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!agentToEdit || !onDelete) return;
    if (confirm(`Tem certeza que deseja remover ${agentToEdit.name} da equipe? Os contatos em andamento voltarão para a fila.`)) {
      setIsSubmitting(true);
      try {
        await onDelete(agentToEdit.id);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir atendente';
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const initials = (name.trim() || 'Atendente')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              {agentToEdit ? <UserCheck className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  {agentToEdit ? 'Painel de Controle: Editar Atendente' : 'Painel de Controle: Cadastrar Atendente'}
                </h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Admin
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                {agentToEdit
                  ? 'Atualize os dados, turno, metas e status operacional'
                  : 'Cadastre um novo operador para realizar chamadas simultâneas na fila'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Preview Badge */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-4 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${selectedColor.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-md transition-all shrink-0`}
            >
              {initials || 'AT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {name.trim() || 'Nome do Atendente'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {role}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {extension && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Ramal {extension}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {shiftOptions.find((s) => s.id === shift)?.label}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-500" />
                  Meta: {dailyGoal} ligs/dia
                </span>
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              status === 'available'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : status === 'paused'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {status === 'available' ? 'Disponível' : status === 'paused' ? 'Em Pausa' : 'Desconectado'}
          </span>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[68vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome do Atendente: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Lucas Mendes, Ana Paula, Carlos Oliveira..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Este nome identifica quem puxa o lead e impede que outros operadores atendam o mesmo contato.
            </span>
          </div>

          {/* Cargo / Função e Ramal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>Cargo / Função:</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                list="roles-list"
                placeholder="Ex.: Atendente Comercial"
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <datalist id="roles-list">
                {rolePresets.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                <span>Ramal ou WhatsApp:</span>
              </label>
              <input
                type="text"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                placeholder="Ex.: 101 ou (11) 99999-8888"
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Turno e Meta Diária */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Turno de Trabalho:</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {shiftOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Meta Diária de Ligações:</span>
              </label>
              <input
                type="number"
                min="10"
                max="500"
                step="5"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Status Inicial */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Status Operacional:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'available',
                  label: 'Disponível',
                  desc: 'Pronto para ligar',
                  bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                },
                {
                  id: 'paused',
                  label: 'Em Pausa',
                  desc: 'Almoço ou pausa',
                  bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                },
                {
                  id: 'offline',
                  label: 'Desconectado',
                  desc: 'Fim do expediente',
                  bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as AgentStatus)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    status === st.id ? `${st.bg} ring-2 ring-blue-500/30 font-bold shadow-xs` : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold leading-none">{st.label}</p>
                  <p className="text-[10px] opacity-80 mt-1">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cores do Crachá / Avatar */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Cor do Crachá de Identificação:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((opt) => {
                const isSelected = selectedColor.color === opt.color;
                return (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setSelectedColor(opt)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${opt.avatarBg} shrink-0`} />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700">
            {agentToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="py-2.5 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Atendente</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Salvando...' : agentToEdit ? 'Atualizar Atendente' : 'Cadastrar Atendente'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
