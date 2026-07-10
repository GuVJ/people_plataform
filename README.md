# People Analytics Copilot

Plataforma de People Analytics com dashboards executivos, copiloto de IA conversacional, modelos preditivos (turnover, absenteísmo, headcount, custo), simulador de workforce planning e benchmark de mercado.

Construída como peça de portfólio para demonstrar domínio em People Analytics, BI e IA aplicada a RH — com identidade visual reaproveitada do CRM Fluxo (Grupo Rafael Thomaz).

## Stack

- React + Vite, React Router
- CSS puro com variáveis (design system próprio, dark/light mode)
- SheetJS (`xlsx`) para exportação client-side
- Base de dados 100% fictícia, gerada em runtime com PRNG determinístico (sem backend)

## Rodando localmente

```bash
npm install
npm run dev
```

## Estrutura

- `src/data/` — geração da base fictícia, agregações, forecasts, motor do copiloto e modelo de risco
- `src/components/ui/` — biblioteca de gráficos e componentes (SVG customizado, sem lib de gráfico)
- `src/pages/` — Início, Workforce, Turnover, Recrutamento, Absenteísmo, Horas Extras, Diversidade, Treinamentos, Desempenho, Copiloto IA, Preditivo, Planejamento, Benchmark, Relatórios
- `src/context/` — autenticação mock (troca de papel RH/Gestor/Diretor/CEO), tema e preferências
