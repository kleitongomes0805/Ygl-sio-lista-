import React, { useState, useEffect } from 'react';
import {
  Building2,
  KeyRound,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Sparkles,
  Share2,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { WorkgroupConfig } from '../types';

interface WorkgroupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkgroup?: WorkgroupConfig;
  onSave: (config: {
    name: string;
    clientName: string;
    password: string;
    description?: string;
  }) => Promise<void>;
  operatorCount: number;
}

export const WorkgroupConfigModal: React.FC<WorkgroupConfigModalProps> = ({
  isOpen,
  onClose,
  currentWorkgroup,
  onSave,
  operatorCount,
}) => {
  const [clientName, setClientName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [groupPassword, setGroupPassword] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setClientName(currentWorkgroup?.clientName || 'Cliente Matriz');
      setGroupName(currentWorkgroup?.name || 'Equipe Comercial Matriz');
      setGroupPassword(currentWorkgroup?.password || 'grupo123');
      setDescription(currentWorkgroup?.description || 'Grupo padrão de atendimento e discagem');
      setError('');
      setCopied(false);
    }
  }, [isOpen, currentWorkgroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Informe o Nome do Grupo de Trabalho.');
      return;
    }
    if (!groupPassword.trim()) {
      setError('Informe a Senha de Acesso do Grupo.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        clientName: clientName.trim() || 'Cliente Matriz',
        name: groupName.trim(),
        password: groupPassword.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar grupo de trabalho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccessInstructions = () => {
    const text = `🏢 *ACESSO À EQUIPE DE ATENDIMENTO - FILADIAL* 📞\n\n` +
      `Olá equipe! Ao abrir o aplicativo FilaDial, informem os seguintes dados para acessar a fila e encontrar seu perfil de trabalho:\n\n` +
      `🏢 *Grupo de Trabalho:* ${groupName.trim()}\n` +
      `🔑 *Senha do Grupo:* ${groupPassword.trim()}\n\n` +
      `👉 *Instruções:*\n` +
      `1. Abra o app FilaDial no navegador ou celular.\n` +
      `2. Digite o Nome do Grupo e a Senha acima.\n` +
      `3. Selecione seu Perfil para começar a atender os contatos da fila!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Cadastrar Cliente & Grupo de Trabalho</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Admin
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina o nome do grupo e a senha que os operadores usarão para acessar o app e encontrar seus perfis.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome do Cliente / Empresa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Cliente / Empresa:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Construtora Horizonte, Acme Corp"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Empresa ou filial proprietária da operação.</p>
            </div>

            {/* Nome do Grupo de Trabalho */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Grupo de Trabalho: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Equipe Comercial Matriz"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              />
              <p className="text-[10px] text-slate-500 mt-1">Nome que o operador digita para entrar no app.</p>
            </div>
          </div>

          {/* Senha do Grupo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Senha de Acesso do Grupo: <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-slate-500">Compartilhada com os operadores</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                placeholder="Ex: grupo123 ou vendas2026"
                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Esta senha permite que qualquer atendente deste grupo acesse o discador e localize seu perfil.
            </p>
          </div>

          {/* Instruções / Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Instruções / Descrição da Operação (Opcional):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Plantão comercial de captação e pós-vendas"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Quick Copy Card for WhatsApp */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Dados para Enviar aos Atendentes:
              </span>
              <button
                type="button"
                onClick={handleCopyAccessInstructions}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-blue-100 dark:border-blue-950 font-mono space-y-1">
              <p>🏢 <strong>Grupo de Trabalho:</strong> {groupName || 'Nome do Grupo'}</p>
              <p>🔑 <strong>Senha do Grupo:</strong> {groupPassword || '••••••••'}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] pt-1">
                Ao entrar no app com esses dados, o operador encontrará seu perfil de trabalho com 1 clique.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Grupo & Senha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
