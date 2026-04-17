---
title: "Kumon-app — Plataforma Financeira Multi-tenant"
subtitle: "Impact X · Abril 2026 · Confidencial"
author: "Rafael Camillo"
date: "16/04/2026"
---

<div class="ix-cover">
<div class="ix-cover-logo">IMPACT <span class="x">X</span></div>
<h1 class="ix-cover-title">Kumon-app → Plataforma Financeira <span class="accent">Multi-tenant</span></h1>
<p class="ix-cover-subtitle">Pesquisa e recomendação sobre gateway, NFS-e e arquitetura para MVP multi-unidade de educação.</p>
<p class="ix-cover-meta">16 DE ABRIL DE 2026 · RAFAEL CAMILLO · CONFIDENCIAL</p>
</div>

<nav id="TOC">
<ul>
<li><a href="#sumario-executivo">Sumário Executivo</a></li>
<li><a href="#estado-atual">Estado Atual do Código</a></li>
<li><a href="#gateways">Gateways de Cobrança</a></li>
<li><a href="#nfse">Emissores NFS-e</a></li>
<li><a href="#custos">Cenários de Custo</a></li>
<li><a href="#recomendacao">Recomendação</a></li>
<li><a href="#migration">Migration Path</a></li>
<li><a href="#riscos">Riscos e Pontos Abertos</a></li>
</ul>
</nav>

<div class="section-heading" id="sumario-executivo"><span class="num">01.</span> Sumário Executivo</div>

<p class="lead">O <strong>kumon-app</strong> já tem integração Cora madura (mTLS + OAuth2 + webhook + NFS-e). O gargalo pra evoluir a "qualquer prestador de educação" não é a camada de cobrança — é a <strong>ausência total de multi-tenancy</strong> e a <strong>cobertura estreita de NFS-e</strong> via Cora. A decisão certa é <strong>não trocar o gateway</strong> (manter Cora), <strong>adicionar Focus NFe como emissor NFS-e padrão</strong>, e investir ~2,5 semanas em arquitetura multi-tenant com adapters pluggáveis.</p>

<div class="metric-row">
  <div class="metric"><div class="value">R$ 0</div><div class="label">Custo gateway (Cora)</div></div>
  <div class="metric"><div class="value">R$ 548</div><div class="label">NFS-e p/ 50 unid</div></div>
  <div class="metric"><div class="value">2,5 sem</div><div class="label">MVP multi-tenant</div></div>
</div>

<div class="box-resumo">
<span class="box-title">Decisão recomendada</span>
Manter <strong>Cora</strong> como gateway. Adicionar <strong>Focus NFe</strong> como emissor NFS-e default (Cora NFS-e vira fallback zero-custo). Introduzir modelo <strong>Organization</strong> + Clerk Organizations + adapters <code>BillingProvider</code>/<code>NfseProvider</code>. Asaas fica como opção v1.1, não MVP.
</div>

<div class="section-heading" id="estado-atual"><span class="num">02.</span> Estado Atual do Código

</div>

## Estado atual {#estado-atual-section}

### Integração Cora — profunda e funcional

- **Auth:** mTLS + OAuth2 client_credentials. Certificado em env vars globais (`CORA_CERT_BASE64`, `CORA_KEY_BASE64`, `CORA_CLIENT_ID`) — singleton, sem isolamento por tenant.
- **Operações:** `emitBoleto`, `cancelBoleto`, `fetchInvoiceStatus`, `emitNfse`, `fetchBalance`, `fetchStatement`, `testConnection` (em `src/lib/integration/cora/cora.integration.ts`).
- **Webhook:** `/api/webhooks/cora` — sem autenticação (DEBT-001), idempotência via `WebhookEvent.coraEventId`, atualiza Invoice por `coraInvoiceId` sem escopo de tenant.
- **State machine:** 7 estados (`DRAFT`, `APPROVED`, `INVOICED`, `PAID`, `OVERDUE`, `CANCELLED`, `ERROR`). Campos Cora-específicos no schema: `coraInvoiceId`, `barcode`, `pixQrCode`, `pdfUrl`.

### NFS-e hoje — surpresa positiva

- **Já emitida via Cora** em `src/lib/billing/nfse-service.ts`. Service code `8.02` (educação LC 116/96) e ISS `2,0%` **hardcoded**.
- Modelo `NfseRecord` com status `PENDING` / `ISSUED` / `ERROR` / `CANCELLED`.
- **Gaps:** Guardian não tem `cnpj` (só CPF), não há UI pra configurar inscrição municipal, não há flag `generateNfse` por cliente.

### Multi-tenancy hoje — inexistente

<div class="box-atencao">
<span class="box-title">Atenção</span>
<strong>Zero tenant scoping</strong> no código. Nenhum <code>organizationId</code> / <code>unitId</code> / <code>tenantId</code> em qualquer modelo Prisma. <code>BillingConfig</code> é tabela single-row com <code>unitName="Kumon Camargos"</code> hardcoded. Query modules têm comentário explícito <em>"Easier multi-tenant filtering in the future"</em>. Clerk Organizations não está ativado.
</div>

<div class="section-heading" id="gateways"><span class="num">03.</span> Gateways de Cobrança</div>

## Gateways BR {#gateways-section}

Modelo assumido: **cada unidade mantém sua própria conta PJ**; o SaaS orquestra via credenciais por tenant (não consolida recebíveis).

| Provider | Boleto pago | PIX recebido | Fixo/mês | BaaS on-behalf | NFS-e | Split | Observação |
|---|---|---|---|---|---|---|---|
| **Cora** (atual) | R$ 0 básico | R$ 0 | R$ 0 | Não — unidade abre conta | Sim (limitado) | Não | DX fraca, mTLS por tenant pesado |
| **AbacatePay** | R$ 1,99 | 0,80% (mín 0,80) | R$ 0 | Parcial, API-first | Não | Sim | Fundada 2024, cobertura menor |
| **Asaas** | R$ 1,99 (Start) | 0,99% (mín 0,19) | R$ 0–129 | Sim — subcontas white-label | Sim (5k+ munic) | Sim | Queixas de retenção de saldo |
| **Iugu** | R$ 2,90 + 2,49% | ~0,99% | R$ 0 | Sim (marketplace) | Não | Sim | Caro, instabilidade pós-aquisição |
| **Pagar.me** | R$ 3,49 | 0,99% | Negociável | Sim (recipients) | Não | Sim | Stone robusto, preço alto sem volume |
| **Mercado Pago** | R$ 3,49 | 0,99% | R$ 0 | Sim (OAuth) | Não | Sim | Exige conta ML PJ por unidade |
| **Stripe BR** | — | ~1,2% | — | Sim (Connect) | Não | Sim | Inviável pra boleto recorrente BR |

<div class="box-insight">
<span class="box-title">Insight</span>
<strong>Asaas</strong> é o único que combina subcontas white-label + NFS-e + split em um só lugar. <strong>Cora</strong> é imbatível em custo (R$ 0) mas exige cada unidade abrir conta PJ própria. <strong>Stripe BR</strong> confirmadamente inviável pro caso de boleto recorrente nacional.
</div>

<div class="section-heading" id="nfse"><span class="num">04.</span> Emissores NFS-e</div>

## NFS-e {#nfse-section}

Contexto: **LC 214/2025** tornou NFS-e Nacional obrigatória a partir de 01/01/2026. Até abr/2026, ~1.463 municípios conveniados e ~3.413 aderentes (>80% da população). Provedores com NFS-e Nacional pulam homologação prefeitura-a-prefeitura.

| Provedor | Preço/nota | Mínimo mensal | Cobertura | API | Novo município |
|---|---|---|---|---|---|
| **Focus NFe** | **R$ 0,10** (Start) | R$ 89,90 (100) → R$ 548 (4k) | 1.400+ + Nacional | REST, webhooks, sandbox | **15 dias, R$ 199 fixo** |
| **NFE.io** | Sem unitário público | R$ 179 (250) → R$ 349 (1k) | "Milhares" + Nacional | REST, webhooks, SDKs | Comercial |
| **PlugNotas** | Não publicado | Não publicado | 3.413+ via Nacional | REST, webhooks | Não publicado |
| **Enotas** | R$ 0,37–0,77 excedente | + R$ 179 adesão | Capitais + ~1.000 | REST, webhooks | Fila — lenta |
| **Cora NFS-e** | **R$ 0** (bundle PJ) | R$ 0 | **Estreita** — só conveniados | Acoplada ao boleto | Cora controla |

<div class="box-dica">
<span class="box-title">Dica</span>
<strong>Focus NFe</strong> ganha nos três eixos críticos: menor preço unitário público, melhor DX (REST + sandbox + docs abertas), e único com <strong>SLA contratual</strong> de 15 dias para homologação de nova prefeitura por R$ 199 fixo.
</div>

<div class="section-heading" id="custos"><span class="num">05.</span> Cenários de Custo</div>

## Custos {#custos-section}

Assumção: 1 unidade ≈ 80 faturas/mês. Escalas: 10 unid = 800 faturas · 50 unid = 4.000 · 200 unid = 16.000. Ticket médio R$ 500. Distribuição: 20% boleto, 80% PIX.

### Cenário A — Status quo expandido (Cora + Cora NFS-e)

| Escala | Cobrança | NFS-e | Total/mês |
|---|---|---|---|
| 10 unidades | R$ 0 | R$ 0 | **R$ 0** |
| 50 unidades | R$ 0 | R$ 0 | **R$ 0** |
| 200 unidades | R$ 0 | R$ 0 | **R$ 0** |

<span class="priority p0">Risco</span> Lock-in total em Cora. Se a prefeitura do tenant não for suportada pela Cora, unidade simplesmente não entra. Rate-limit Cora já foi problema em produção (DEBT conhecido).

### Cenário B — Cora + Focus NFe (recomendado)

| Escala | Cobrança | NFS-e Focus | Total/mês |
|---|---|---|---|
| 10 unidades | R$ 0 | R$ 89,90 (Start) | **R$ 90** |
| 50 unidades | R$ 0 | R$ 548 (Growth 4k) | **R$ 548** |
| 200 unidades | R$ 0 | R$ 548 + 12k × 0,12 | **R$ 1.988** |

<span class="priority p1">Ganho</span> Cobertura de 1.400+ municípios + SLA de 15d pra novas prefeituras. Desacopla NFS-e do gateway.

### Cenário C — Asaas full (cobrança + NFS-e + subcontas)

| Escala | Boleto | PIX (% sobre R$ 500) | Plano Pro | Total/mês |
|---|---|---|---|---|
| 10 unidades | R$ 318 | R$ 3.168 | R$ 49 | **R$ 3.535** |
| 50 unidades | R$ 1.592 | R$ 15.840 | R$ 129 | **R$ 17.561** |
| 200 unidades | R$ 6.368 | R$ 63.360 | R$ 129 | **R$ 69.857** |

<div class="box-atencao">
<span class="box-title">Atenção</span>
O custo do % PIX do Asaas é <strong>do tenant</strong>, não seu. Se repassado na fatura, Asaas custa R$ 49–129/mês fixo pro SaaS. Se absorvido, inviabiliza margem. Decisão comercial crítica antes de adotar.
</div>

<div class="section-heading" id="recomendacao"><span class="num">06.</span> Recomendação</div>

## Recomendação {#recomendacao-section}

<span class="priority p0">P0</span> **Manter Cora como gateway principal.** Zero fee é imbatível e a integração já está em produção (mTLS, webhook, state machine). Reaproveita `src/lib/integration/cora/` inteiro.

<span class="priority p0">P0</span> **Adotar Focus NFe como emissor NFS-e default.** Cobertura de 1.400+ municípios + NFS-e Nacional + SLA de 15d. Cora NFS-e vira fallback zero-custo nos municípios onde já funciona.

<span class="priority p0">P0</span> **Multi-tenancy via `Organization` + Clerk Organizations.** Adicionar `organizationId` em 8 modelos (Guardian, Student, Enrollment, Invoice, BillingConfig, Expense, NfseRecord, WebhookEvent). `BillingConfig` vira per-org com credenciais Cora criptografadas por tenant.

<span class="priority p1">P1</span> **Camada de abstração provider-agnostic.** `src/lib/integration/billing/{billing-provider.interface, cora-provider}.ts` e `src/lib/integration/nfse/{nfse-provider.interface, cora-nfse-provider, focus-nfse-provider}.ts`. Cada Organization escolhe seu par `{billingProvider, nfseProvider}`.

<span class="priority p2">P2</span> **Asaas como adapter opcional (v1.1).** Útil quando tenant não quiser abrir conta Cora PJ. Não priorizar no MVP.

<div class="section-heading" id="migration"><span class="num">07.</span> Migration Path</div>

## Migration Path {#migration-section}

| Fase | Entregável | Esforço |
|---|---|---|
| **F0** | Relatório PDF + decisão aprovada | 0 — pronto |
| **F1** | Schema: `Organization` + `organizationId` em 8 modelos + migração | 2–3 dias |
| **F2** | Query modules com filtro obrigatório + Clerk Organizations + middleware | 2–3 dias |
| **F3** | Abstração `BillingProvider` / `NfseProvider` + Cora como primeiro adapter | 2 dias |
| **F4** | Adapter Focus NFe + UI pra selecionar emissor por org | 3 dias |
| **F5** | Webhook auth + scoping por organização | 1 dia |
| **F6** | Onboarding flow (KYC Cora, cadastro prefeitura, smoke test) | 3–5 dias |

**Total MVP multi-tenant: ~2,5 semanas focadas.**

<div class="section-heading" id="riscos"><span class="num">08.</span> Riscos e Pontos Abertos</div>

## Riscos {#riscos-section}

<div class="alert-card orange">
<div class="alert-title">Cora credential storage</div>
<div class="alert-desc">Guardar certificado mTLS por tenant exige KMS/vault. Sem isso, arquivo em disco com RLS no DB — não aceitável pra produção multi-cliente.</div>
</div>

<div class="alert-card red">
<div class="alert-title">Webhook cross-tenant (bug latente)</div>
<div class="alert-desc">Handler atual encontra Invoice por <code>coraInvoiceId</code> sem checar tenant. Em multi-tenant, dois tenants com IDs colidindo podem corromper dados do outro. Resolver em F2 antes de liberar 2ª unidade.</div>
</div>

<div class="alert-card yellow">
<div class="alert-title">Rate limits Cora</div>
<div class="alert-desc">Já é dor em 1 unidade (documentado em <code>docs/known-bugs.md</code>). Em 50 unidades vai piorar. Validar com comercial Cora antes de F6.</div>
</div>

<div class="alert-card yellow">
<div class="alert-title">LC 214/2025 — NFS-e Nacional</div>
<div class="alert-desc">Pode substituir maioria das integrações municipais até 2027. Focus NFe já suporta — reduz risco de obsolescência do adapter.</div>
</div>

## Próximos Passos {#proximos-passos}

| Ação | Responsável | Prazo |
|------|-------------|-------|
| Aprovar decisão Cora + Focus NFe | <span class="owner-badge rafa">Rafa</span> | 18/04 |
| Validar rate-limits Cora com comercial | <span class="owner-badge rafa">Rafa</span> | 22/04 |
| Abrir conta sandbox Focus NFe | <span class="owner-badge rafa">Rafa</span> | 22/04 |
| Iniciar F1 (schema Organization) | <span class="owner-badge ai">AI</span> | 23/04 |

---
*Feito por Impact X — Rafael Camillo*
