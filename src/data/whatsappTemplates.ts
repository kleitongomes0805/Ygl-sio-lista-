import { WhatsAppTemplate } from '../types';

export const defaultWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    title: '👋 Primeiro Contato / Apresentação',
    category: 'intro',
    text: 'Olá {nome}! Tudo bem? Me chamo {operador} da {empresa}. Estou entrando em contato para conversar sobre as soluções que temos para o seu negócio. Poderia falar agora por aqui?',
  },
  {
    id: 'tpl-2',
    title: '📞 Tentativa de Ligação Sem Sucesso',
    category: 'unanswered',
    text: 'Olá {nome}, tentei ligar para você agora a pouco pelo número {telefone}, mas não consegui completar a chamada. Quando tiver um momento, me dê um alô por aqui para alinharmos!',
  },
  {
    id: 'tpl-3',
    title: '💼 Envio de Proposta & Apresentação',
    category: 'proposal',
    text: 'Olá {nome}! Conforme combinamos em nossa chamada, segue nossa proposta personalizada para a {empresa}. Fico à disposição para tirar qualquer dúvida e agendar uma demonstração.',
  },
  {
    id: 'tpl-4',
    title: '📅 Agendamento de Reunião',
    category: 'scheduling',
    text: 'Olá {nome}! Gostaria de agendar uma rápida conversa de 15 minutos esta semana para demonstrar como podemos otimizar seus resultados. Qual o melhor dia e horário para você?',
  },
  {
    id: 'tpl-5',
    title: '⚡ Follow-up Rápido',
    category: 'custom',
    text: 'Oi {nome}, tudo certo? Passando apenas para saber se teve a oportunidade de avaliar nossa conversa anterior. Qualquer dúvida estou por aqui!',
  },
];
