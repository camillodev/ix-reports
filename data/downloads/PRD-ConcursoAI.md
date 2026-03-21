# PRD: ConcursoAI — Plataforma Inteligente de Estudo para Concursos

---

## 1. Contexto

- **Problema**: Estudar para concurso público no Brasil é caótico. O candidato precisa manualmente cruzar edital com provas anteriores, entender o perfil da banca, montar plano de estudo, e adaptar a estratégia ao longo do tempo. Isso consome centenas de horas e favorece quem pode pagar cursinho caro.
- **Quem afeta**: Concurseiros iniciantes (não sabem por onde começar) e experientes (querem otimizar tempo e focar nos gaps).
- **Impacto se não resolver**: Candidatos estudam conteúdo errado, na ordem errada, sem estratégia — e reprovam. O mercado de concursos movimenta R$ 30B+/ano no Brasil, mas as ferramentas são genéricas e burras.

---

## 2. Objetivo

Criar uma plataforma SaaS que usa IA para transformar editais e provas anteriores em planos de estudo personalizados, adaptados ao perfil, tempo disponível e progresso do candidato.

---

## 3. User Stories

### Onboarding & Perfil
- Como **concurseiro**, quero informar meu nível de conhecimento por matéria, para que o plano já comece ajustado ao que eu sei e ao que eu não sei.
- Como **concurseiro**, quero informar quanto tempo tenho até a prova e quantas horas/dia posso estudar, para que o plano seja realista.
- Como **concurseiro**, quero escolher meu nível de preparação desejado (passar / passar bem / gabaritar), para que a intensidade se ajuste.

### Análise de Edital & Banca
- Como **concurseiro**, quero fazer upload do edital (PDF) ou selecionar de uma base pré-populada, para que o sistema extraia as matérias e pesos.
- Como **concurseiro**, quero que o sistema cruze o edital com provas anteriores da mesma banca/cargo, para identificar os temas mais cobrados.
- Como **concurseiro**, quero visualizar a análise da banca (estilo de questão, pegadinhas frequentes, distribuição por tema), para estudar de forma direcionada.

### Plano de Estudo
- Como **concurseiro**, quero receber um plano de estudo semanal gerado por IA, com matérias priorizadas por peso × frequência × meu gap de conhecimento.
- Como **concurseiro**, quero que o plano se adapte semanalmente com base no meu progresso real (simulados, tempo de estudo, revisões).
- Como **concurseiro**, quero poder ajustar manualmente o plano (mover matérias, adicionar dias de folga), sem perder a otimização.

### Conteúdo & Revisão
- Como **concurseiro**, quero acessar resumos gerados por IA para cada tópico do edital, baseados em material de qualidade.
- Como **concurseiro**, quero que as fontes dos resumos sejam listadas e eu possa aprová-las antes de usar, para garantir confiabilidade.
- Como **concurseiro**, quero um sistema de revisão espaçada (spaced repetition) integrado ao plano.

### Progresso & Adaptação
- Como **concurseiro**, quero ver meu progresso geral e por matéria num dashboard visual.
- Como **concurseiro**, quero que o sistema identifique meus pontos fracos e redistribua o tempo de estudo automaticamente.
- Como **concurseiro**, quero atualizar minha estratégia toda semana com base no que estudei e nos resultados dos simulados.

---

## 4. Requisitos Funcionais

| ID | Requisito | Prioridade | MVP? |
|----|-----------|-----------|------|
| **RF-01** | Upload e parsing de edital (PDF) com extração de matérias, pesos e critérios | Must | ✅ |
| **RF-02** | Base pré-populada de editais e provas anteriores (scraping + curadoria) | Must | ✅ (seed manual) |
| **RF-03** | Cruzamento edital × provas anteriores da mesma banca/cargo | Must | ✅ |
| **RF-04** | Análise de perfil da banca (estilo, temas recorrentes, pegadinhas) | Must | ✅ |
| **RF-05** | Onboarding adaptativo: tempo disponível, nível por matéria, meta de preparação | Must | ✅ |
| **RF-06** | Geração de plano de estudo personalizado via IA (Claude API) | Must | ✅ |
| **RF-07** | Dashboard de progresso com métricas por matéria | Must | ✅ |
| **RF-08** | Geração de resumos por tópico via IA com citação de fontes | Must | ✅ |
| **RF-09** | Aprovação de fontes pelo usuário antes de gerar conteúdo | Must | ✅ |
| **RF-10** | Atualização semanal do plano com base em progresso real | Must | ✅ |
| **RF-11** | Sistema de revisão espaçada (spaced repetition) | Should | ❌ v2 |
| **RF-12** | Simulados com questões de provas anteriores | Should | ❌ v2 |
| **RF-13** | Gamificação (streaks, pontos, conquistas) | Could | ❌ v3 |
| **RF-14** | Modo estudo offline (PWA) | Could | ❌ v3 |

---

## 5. Arquitetura de IA (Claude Subagents)

O diferencial técnico é o uso de **agentes especializados** que trabalham em pipeline:

```
[Agent 1: Extrator de Edital]
    → Recebe PDF do edital
    → Extrai: matérias, pesos, requisitos, banca, cargo
    → Output: JSON estruturado do edital

[Agent 2: Pesquisador de Banca]
    → Recebe: banca + cargo + edital estruturado
    → Busca provas anteriores (web search + base interna)
    → Cruza temas do edital com questões históricas
    → Output: análise de frequência por tema + estilo da banca

[Agent 3: Estrategista de Estudo]
    → Recebe: edital + análise da banca + perfil do usuário
    → Calcula: prioridade = (peso no edital × frequência na banca × gap do aluno)
    → Gera plano semanal otimizado
    → Output: plano de estudo com cronograma

[Agent 4: Gerador de Conteúdo]
    → Recebe: tópico específico + nível do aluno
    → Busca fontes confiáveis (leis, doutrinas, materiais)
    → Apresenta fontes ao usuário pra aprovação
    → Gera resumo adaptado ao nível
    → Output: conteúdo resumido com fontes citadas

[Agent 5: Adaptador Semanal]
    → Recebe: progresso da semana + plano atual
    → Recalcula prioridades
    → Ajusta plano pra próxima semana
    → Output: plano atualizado + insights de progresso
```

**Importante**: O usuário **sempre aprova** as fontes antes do conteúdo ser gerado. Transparência > automação cega.

---

## 6. Requisitos Não-Funcionais

- **Performance**: < 3s para gerar plano de estudo. < 10s para análise de edital completa.
- **Segurança**: Auth via Clerk. Dados do usuário criptografados. Rate limiting na API Claude.
- **Escalabilidade**: Suportar 10k usuários concorrentes no MVP. Arquitetura stateless.
- **Acessibilidade**: WCAG 2.1 AA. Mobile-first responsive.
- **Custo de IA**: Estimar consumo de tokens por operação. Cache agressivo de análises repetidas.

---

## 7. Stack Técnica

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript | App Router, SSR/SSG, React Server Components |
| **UI** | Tailwind CSS + shadcn/ui | Rápido, consistente, acessível |
| **Auth** | Clerk | Auth completo em minutos, social login, free tier generoso |
| **Database** | Supabase (PostgreSQL) | Auth backup, real-time, storage, edge functions |
| **ORM** | Drizzle ORM | Type-safe, leve, melhor DX que Prisma |
| **IA** | Claude API (Anthropic) | Subagents via tool_use, melhor raciocínio pra análise |
| **Storage** | Supabase Storage | Upload de PDFs de editais |
| **Deploy** | Vercel | Preview deploys, edge, integração com Next.js |
| **Pagamento** | Stripe | Padrão SaaS, checkout pronto |
| **Analytics** | PostHog | Open source, event tracking, feature flags |

---

## 8. Modelo de Dados (Principais)

```sql
-- Usuários (gerenciado pelo Clerk, extended no Supabase)
users (
  id UUID PK,
  clerk_id TEXT UNIQUE,
  study_hours_per_day INT,
  preparation_level ENUM('pass', 'pass_well', 'ace'),
  exam_date DATE,
  created_at TIMESTAMP
)

-- Concursos
exams (
  id UUID PK,
  name TEXT,              -- "Auditor Fiscal da Receita Federal 2025"
  organization TEXT,      -- "Receita Federal"
  exam_board TEXT,        -- "CESPE/CEBRASPE"
  year INT,
  edital_url TEXT,
  edital_pdf_path TEXT,
  status ENUM('active', 'archived')
)

-- Matérias do edital
exam_subjects (
  id UUID PK,
  exam_id UUID FK → exams,
  name TEXT,              -- "Direito Tributário"
  weight DECIMAL,         -- peso no edital
  frequency_score DECIMAL, -- frequência em provas anteriores
  topic_count INT
)

-- Tópicos por matéria
topics (
  id UUID PK,
  subject_id UUID FK → exam_subjects,
  name TEXT,
  historical_frequency DECIMAL,
  difficulty_level ENUM('basic', 'intermediate', 'advanced')
)

-- Perfil de conhecimento do usuário
user_knowledge (
  id UUID PK,
  user_id UUID FK → users,
  subject_id UUID FK → exam_subjects,
  self_assessed_level ENUM('zero', 'basic', 'intermediate', 'advanced'),
  current_score DECIMAL,  -- atualizado por simulados
  last_studied_at TIMESTAMP
)

-- Plano de estudo
study_plans (
  id UUID PK,
  user_id UUID FK → users,
  exam_id UUID FK → exams,
  week_number INT,
  plan_data JSONB,        -- plano semanal detalhado
  generated_at TIMESTAMP,
  status ENUM('active', 'completed', 'replaced')
)

-- Progresso
study_progress (
  id UUID PK,
  user_id UUID FK → users,
  topic_id UUID FK → topics,
  time_spent_minutes INT,
  completion_percentage DECIMAL,
  notes TEXT,
  studied_at DATE
)

-- Fontes aprovadas
approved_sources (
  id UUID PK,
  user_id UUID FK → users,
  topic_id UUID FK → topics,
  source_url TEXT,
  source_title TEXT,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP
)

-- Resumos gerados
generated_summaries (
  id UUID PK,
  topic_id UUID FK → topics,
  user_id UUID FK → users,
  content TEXT,
  sources JSONB,          -- array de fontes usadas
  ai_model TEXT,
  generated_at TIMESTAMP
)
```

---

## 9. Telas Principais (MVP)

1. **Landing Page** — Proposta de valor, CTA pra cadastro
2. **Onboarding** (multi-step) — Escolher concurso → Upload edital ou selecionar da base → Informar perfil (tempo, nível, meta)
3. **Dashboard** — Progresso geral, plano da semana, próxima matéria
4. **Análise do Edital** — Matérias × pesos × frequência na banca (visualização)
5. **Plano de Estudo** — Cronograma semanal, drag-and-drop pra ajustar
6. **Estudo** — Resumo do tópico + fontes + marcador de progresso
7. **Revisão Semanal** — Progresso vs. planejado + novo plano gerado
8. **Settings** — Perfil, assinatura, preferências

---

## 10. Fora de Escopo (MVP)

- Videoaulas
- Fórum/comunidade entre usuários
- App mobile nativo (PWA serve)
- Integração com plataformas de cursinho (QConcursos, Gran, etc.)
- Geração de questões originais (só usa provas reais)
- Suporte a concursos militares (escopo inicial: concursos civis federais/estaduais)

---

## 11. Métricas de Sucesso

| Métrica | Baseline | Target (3 meses) | Como medir |
|---------|----------|-------------------|-----------|
| Cadastros | 0 | 1.000 | Clerk + PostHog |
| Retenção D7 | 0% | 40% | PostHog cohorts |
| Planos gerados | 0 | 3.000 | DB count |
| NPS | - | > 50 | In-app survey |
| Conversão free→paid | 0% | 5% | Stripe + PostHog |
| Custo IA por usuário/mês | - | < R$5 | Token tracking |

---

## 12. Modelo de Monetização

| Plano | Preço | Inclui |
|-------|-------|--------|
| **Free** | R$0 | 1 concurso, análise de edital, plano básico |
| **Pro** | R$29,90/mês | Ilimitado, resumos IA, revisão semanal, todas as bancas |
| **Premium** | R$49,90/mês | Tudo do Pro + simulados, spaced repetition, prioridade na IA |

---

## 13. Timeline

| Fase | Duração | Entregável |
|------|---------|-----------|
| **PRD + Validação** | 1 semana | Este documento ✅ |
| **Protótipo Navegável** | 1 semana | HTML/React interativo pra validar fluxo |
| **MVP Dev** | 4-6 semanas | App funcional com RF-01 a RF-10 |
| **Beta Fechado** | 2 semanas | 50 usuários beta, coleta de feedback |
| **Launch público** | 1 semana | Landing page, Stripe, marketing |

---

## 14. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Custo de tokens Claude explodir | Alta | Alto | Cache agressivo, limites por plano, batch processing |
| Qualidade dos resumos IA inconsistente | Média | Alto | Fontes aprovadas pelo usuário, feedback loop |
| Scraping de provas anteriores instável | Alta | Médio | Híbrido: base manual + upload do usuário |
| Concorrência (QConcursos, Gran, etc.) | Alta | Médio | Diferencial: IA personalizada vs. conteúdo genérico |
| Direitos autorais de provas | Média | Alto | Usar apenas provas públicas, citar fonte sempre |

---

## 15. Aprovações

- [ ] Product (Rafa)
- [ ] Engineering (Rafa)
- [ ] Validação via protótipo navegável
