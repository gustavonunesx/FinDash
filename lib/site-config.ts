export const siteConfig = {
  name: "FinDash",
  title: "FinDash — Finanças pessoais com clareza",
  description:
    "Dashboard de inteligência financeira com método 50/30/20. Transforme números em decisões claras para jovens brasileiros.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  keywords: [
    "finanças pessoais",
    "50/30/20",
    "controle de gastos",
    "organização financeira",
    "investimentos",
    "Brasil",
  ],
};

export const faqItems = [
  {
    q: "O FinDash é gratuito?",
    a: "Sim. O plano Free é permanente com 10 gastos e 3 fundos. O Premium desbloqueia histórico, PDF e família por R$19/mês.",
  },
  {
    q: "O que é a regra 50/30/20?",
    a: "50% da renda para necessidades, 30% para objetivos e 20% para qualidade de vida. O FinDash calcula automaticamente e mostra seu score.",
  },
  {
    q: "Preciso conectar meu banco?",
    a: "Não. Você cadastra gastos manualmente ou importa via CSV. Sem Open Finance — mais simples e privado.",
  },
  {
    q: "Como funciona o trial Premium?",
    a: "14 dias grátis via Stripe. Cancele quando quiser pelo portal de assinatura.",
  },
];
