import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  RefreshCw,
  PlusCircle,
  Table,
} from 'lucide-react';
import { Contact, ContactStatus } from '../types';
import { exportToCsv, getStatusBadgeClass, getStatusLabel } from '../utils/formatters';

interface ImportExportViewProps {
  contacts: Contact[];
  onImportContacts: (contacts: any[], mode: 'append' | 'replace') => Promise<void>;
  onClearQueue: (target: 'all' | 'completed') => Promise<void>;
  onResetSample: () => void;
  isLoading: boolean;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  contacts,
  onImportContacts,
  onClearQueue,
  onResetSample,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'export'>('import');

  // Import State
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Export Filter
  const [exportFilter, setExportFilter] = useState<string>('all');

  // Parse CSV / Text
  const parseRawText = (text: string) => {
    try {
      setImportError(null);
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        setParsedPreview([]);
        return;
      }

      const results: any[] = [];
      // Check if header exists
      const firstLine = lines[0].toLowerCase();
      const hasHeader =
        firstLine.includes('nome') ||
        firstLine.includes('name') ||
        firstLine.includes('telefone') ||
        firstLine.includes('phone');

      const startIdx = hasHeader ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma, semicolon, or tab
        let parts = line.split(/[;\t,]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          results.push({
            name: parts[0] || 'Contato',
            phone: parts[1] || '',
            company: parts[2] || '',
            email: parts[3] || '',
            notes: parts[4] || '',
          });
        }
      }

      if (results.length === 0) {
        setImportError('Nenhuma linha válida encontrada. Use o formato: Nome, Telefone, Empresa, Email');
      } else {
        setParsedPreview(results);
      }
    } catch (err: any) {
      setImportError('Erro ao processar dados: ' + err.message);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPastedText(content);
      parseRawText(content);
    };
    reader.readAsText(file);
  };

  // Perform import
  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) return;
    await onImportContacts(parsedPreview, importMode);
    setImportSuccessMessage(
      `${parsedPreview.length} contatos importados com sucesso na fila!`
    );
    setPastedText('');
    setParsedPreview([]);
    setTimeout(() => setImportSuccessMessage(null), 4000);
  };

  // Filtered contacts for export
  const exportableContacts = contacts.filter((c) => {
    if (exportFilter === 'all') return true;
    if (exportFilter === 'completed') return c.status !== 'pending' && c.status !== 'in_progress';
    if (exportFilter === 'answered') return ['answered', 'interested'].includes(c.status);
    if (exportFilter === 'whatsapp') return c.status === 'whatsapp_sent';
    if (exportFilter === 'unanswered') return ['unanswered', 'busy', 'voicemail'].includes(c.status);
    if (exportFilter === 'pending') return c.status === 'pending';
    return true;
  });

  // Export as CSV
  const handleDownloadCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCsv(exportableContacts, `filadial-relatorio-${exportFilter}-${timestamp}.csv`);
  };

  // Export as JSON
  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            total: exportableContacts.length,
            contacts: exportableContacts,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `filadial-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <span>Gerenciador de Listas: Importar & Exportar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Importe planilhas de leads para a fila e exporte os resultados com o status atualizado
            de cada chamada e mensagem enviada
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'import'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Importar Lista</span>
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'export'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Relatório com Status</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: IMPORT */}
      {activeSubTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload / Paste (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Como deseja importar sua lista de contatos?
              </h3>

              {/* Option A: Upload File */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block">
                  Escolher arquivo CSV ou TXT
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400 block mt-1">
                  Formatos aceitos: .CSV, .TXT separados por vírgula ou ponto-e-vírgula
                </span>
              </div>

              {/* Option B: Direct Paste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ou cole diretamente do Excel / Bloco de Notas:
                  </label>
                  <button
                    onClick={() => {
                      const sample = `Nome, Telefone, Empresa, Observação
Carlos Menezes, (11) 98765-4321, Construtora Alfa, Interesse em automação
Fernanda Souza, (21) 99888-7766, Agência Criativa, Retorno solicitado
Rodrigo Mattos, (31) 98444-3322, Logística Sul, Lead qualificado inbound`;
                      setPastedText(sample);
                      parseRawText(sample);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Colar Exemplo
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    parseRawText(e.target.value);
                  }}
                  placeholder="Nome, Telefone, Empresa, Email, Observações..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Import Mode Radio */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Modo de Importação na Fila:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span>Adicionar à Fila Atual</span>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        Mantém os contatos que já estão na fila e insere os novos no final.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <span>Substituir Toda a Fila</span>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        Zera a fila atual e inicia uma nova campanha somente com esta lista.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            {/* Quick Demo Data Actions */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Quer testar sem precisar de uma planilha?
                  </span>
                  <span className="text-slate-500">
                    Carregue nossa lista de demonstração com 12 leads brasileiros.
                  </span>
                </div>
              </div>
              <button
                onClick={onResetSample}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 transition-colors shrink-0"
              >
                Carregar 12 Leads Demo
              </button>
            </div>
          </div>

          {/* Right Column: Preview of Parsed Contacts (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col h-full min-h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-blue-600" />
                    <span>Prévia de Importação ({parsedPreview.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Verifique as colunas identificadas antes de confirmar
                  </p>
                </div>
                {parsedPreview.length > 0 && (
                  <button
                    onClick={() => setParsedPreview([])}
                    className="text-[11px] text-slate-400 hover:text-rose-600"
                  >
                    Limpar Prévia
                  </button>
                )}
              </div>

              {parsedPreview.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <span>Nenhum dado processado ainda.</span>
                  <span className="text-[11px] mt-1">
                    Envie um arquivo CSV ou cole contatos ao lado para visualizar a prévia aqui.
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                    {parsedPreview.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs space-y-0.5"
                      >
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>{item.name}</span>
                          <span className="font-mono text-blue-600">{item.phone}</span>
                        </div>
                        {item.company && (
                          <div className="text-[11px] text-slate-500">{item.company}</div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-slate-400 italic truncate">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                    <button
                      onClick={handleConfirmImport}
                      disabled={isLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Confirmar e Importar {parsedPreview.length} Contatos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPORT */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Exportar Relatório Completo com Status da Fila
              </h3>
              <p className="text-xs text-slate-500">
                Baixe a lista contendo o desfecho de cada contato, duração da chamada, operador
                responsável e observações registradas.
              </p>
            </div>

            {/* Filter Selector */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">
                Filtrar o que exportar:
              </span>
              {[
                { id: 'all', label: `Todos (${contacts.length})` },
                {
                  id: 'completed',
                  label: `Concluídos / Finalizados (${contacts.filter((c) => !['pending', 'in_progress'].includes(c.status)).length})`,
                },
                {
                  id: 'answered',
                  label: `Atendidos & Vendas (${contacts.filter((c) => ['answered', 'interested'].includes(c.status)).length})`,
                },
                {
                  id: 'whatsapp',
                  label: `WhatsApp Enviado (${contacts.filter((c) => c.status === 'whatsapp_sent').length})`,
                },
                {
                  id: 'unanswered',
                  label: `Não Atende / Ocupado (${contacts.filter((c) => ['unanswered', 'busy', 'voicemail'].includes(c.status)).length})`,
                },
                {
                  id: 'pending',
                  label: `Apenas Restantes na Fila (${contacts.filter((c) => c.status === 'pending').length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExportFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    exportFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleDownloadCsv}
                disabled={exportableContacts.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Planilha CSV ({exportableContacts.length} contatos)</span>
              </button>

              <button
                onClick={handleDownloadJson}
                disabled={exportableContacts.length === 0}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Baixar JSON</span>
              </button>
            </div>

            {/* Preview of Exportable Data */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">Telefone</th>
                    <th className="py-2.5 px-3">Empresa</th>
                    <th className="py-2.5 px-3">Status Final Marcado</th>
                    <th className="py-2.5 px-3">Último Contato</th>
                    <th className="py-2.5 px-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {exportableContacts.slice(0, 8).map((c) => {
                    const badge = getStatusBadgeClass(c.status);
                    return (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {c.phone}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{c.company || '-'}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {getStatusLabel(c.status)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-400">
                          {c.lastContactedAt
                            ? new Date(c.lastContactedAt).toLocaleString('pt-BR')
                            : 'Não contactado'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {c.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {exportableContacts.length > 8 && (
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                  + {exportableContacts.length - 8} contatos adicionais serão incluídos no download
                </div>
              )}
            </div>

            {/* Queue Management: Clear Queue */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Ações de limpeza e manutenção da fila:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onClearQueue('completed')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold"
                >
                  Limpar Apenas Concluídos
                </button>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja apagar todos os contatos da fila?')) {
                      onClearQueue('all');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar Fila Inteira</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
