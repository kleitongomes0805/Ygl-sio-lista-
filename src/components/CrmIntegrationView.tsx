import React, { useState } from 'react';
import {
  Webhook,
  Key,
  Copy,
  Check,
  Code2,
  Send,
  Sparkles,
  Server,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CrmIntegrationViewProps {
  apiKey: string;
  webhookUrl: string;
  onUpdateConfig: (webhookUrl: string, regenerateKey?: boolean) => Promise<void>;
  onTestWebhook: () => Promise<void>;
  isLoading: boolean;
}

export const CrmIntegrationView: React.FC<CrmIntegrationViewProps> = ({
  apiKey,
  webhookUrl: initialWebhookUrl,
  onUpdateConfig,
  onTestWebhook,
  isLoading,
}) => {
  const [webhookInput, setWebhookInput] = useState(initialWebhookUrl || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl');

  // Simulator State
  const [simName, setSimName] = useState('Mariana Bastos');
  const [simPhone, setSimPhone] = useState('(11) 97654-3210');
  const [simCompany, setSimCompany] = useState('Bastos Engenharia');
  const [simNotes, setSimNotes] = useState('Lead vindo do formulário de contato do site (RD Station)');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveWebhook = async () => {
    try {
      await onUpdateConfig(webhookInput, false);
      setStatusMsg({ type: 'success', text: 'URL do Webhook salva com sucesso!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Erro ao salvar Webhook' });
    }
  };

  const handleRegenerateKey = async () => {
    if (confirm('Tem certeza? A chave antiga deixará de funcionar imediatamente.')) {
      await onUpdateConfig(webhookInput, true);
      setStatusMsg({ type: 'success', text: 'Nova Chave de API gerada com sucesso!' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Run lead ingestion via actual API call
  const handleSimulateCrmLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          name: simName,
          phone: simPhone,
          company: simCompany,
          notes: simNotes,
        }),
      });

      const data = await res.json();
      setSimResult(data);
      setStatusMsg({
        type: 'success',
        text: 'Lead injetado via API com sucesso! Ele já apareceu na fila de discagem.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Falha na chamada de API: ' + err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sua-url.com';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Webhook className="w-5 h-5 text-purple-600" />
          <span>Integração via API com Sistemas de CRM Externos</span>
        </h2>
        <p className="text-xs text-slate-500">
          Conecte o FilaDial ao HubSpot, RD Station, Salesforce, Pipedrive, ActiveCampaign ou
          sistemas próprios via Webhook e REST API
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: Credentials & Webhook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: API Key */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" />
              <span>Chave de API do FilaDial (Secret Token)</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-300">
              Ativo
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Utilize este token no cabeçalho <code>Authorization: Bearer</code> para autenticar
            requisições vindas do seu CRM ou automação.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={apiKey}
              className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={handleCopyKey}
              className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Copiar Chave"
            >
              {copiedKey ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={handleRegenerateKey}
            className="text-xs text-slate-500 hover:text-purple-600 font-medium underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerar chave de API</span>
          </button>
        </div>

        {/* Box 2: Outbound Webhook */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-teal-600" />
              <span>Webhook de Saída (FilaDial ➔ CRM)</span>
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Sempre que um operador finalizar uma chamada ou enviar WhatsApp, o FilaDial enviará um{' '}
            <code>POST</code> com os dados atualizados para esta URL.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://seu-crm.com/api/webhook/filadial"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={handleSaveWebhook}
              disabled={isLoading}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              Salvar
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Dispara no evento: <code>contact.updated</code>
            </span>
            <button
              onClick={onTestWebhook}
              disabled={!webhookInput}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Testar Disparo Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Box & REST API Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive CRM Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulador: Enviar Lead do CRM Externo
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Teste a integração em tempo real enviando um lead como se fosse o seu CRM. O lead entrará
            imediatamente na fila de ligações dos 5 operadores!
          </p>

          <form onSubmit={handleSimulateCrmLead} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome do Lead:
              </label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                required
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Telefone (com DDD):
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                required
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Empresa:
              </label>
              <input
                type="text"
                value={simCompany}
                onChange={(e) => setSimCompany(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Observação / Origem no CRM:
              </label>
              <textarea
                rows={2}
                value={simNotes}
                onChange={(e) => setSimNotes(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando via API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Disparar API: Injetar na Fila</span>
                </>
              )}
            </button>
          </form>

          {simResult && (
            <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
              <span className="text-slate-400 block mb-1">Resposta do Servidor FilaDial:</span>
              <pre>{JSON.stringify(simResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Right: API Documentation & Code Snippets (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Documentação dos Endpoints REST</span>
            </h3>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-[11px] font-bold">
              {(['curl', 'js', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-2 py-0.5 rounded uppercase ${
                    codeLang === lang
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint 1: POST /api/crm/contacts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-mono font-bold text-xs">
                POST
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                /api/crm/contacts
              </span>
              <span className="text-[11px] text-slate-400">- Ingestão de leads na fila</span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] overflow-x-auto">
              {codeLang === 'curl' && (
                <pre>{`curl -X POST "${baseUrl}/api/crm/contacts" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Juliana Rocha",
    "phone": "(11) 98888-7777",
    "company": "Rocha Advocacia",
    "email": "juliana@rocha.com",
    "notes": "Lead inbound via Google Ads"
  }'`}</pre>
              )}

              {codeLang === 'js' && (
                <pre>{`await fetch("${baseUrl}/api/crm/contacts", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Juliana Rocha",
    phone: "(11) 98888-7777",
    company: "Rocha Advocacia",
    notes: "Lead inbound via Google Ads"
  })
});`}</pre>
              )}

              {codeLang === 'python' && (
                <pre>{`import requests

url = "${baseUrl}/api/crm/contacts"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "name": "Juliana Rocha",
    "phone": "(11) 98888-7777",
    "company": "Rocha Advocacia",
    "notes": "Lead inbound via Google Ads"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
              )}
            </div>
          </div>

          {/* Endpoint 2: GET /api/crm/contacts */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-mono font-bold text-xs">
                GET
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                /api/crm/contacts
              </span>
              <span className="text-[11px] text-slate-400">
                - Consultar status e histórico de ligações
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] overflow-x-auto">
              <pre>{`curl -X GET "${baseUrl}/api/crm/contacts?status=answered" \\
  -H "Authorization: Bearer ${apiKey}"`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
