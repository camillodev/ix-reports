---
title: "Benchmark Isaac — Ideias para o Sistema Kumon Camargos"
subtitle: "Impact X · Abril 2026 · Confidencial"
author: "Rafael Camillo"
date: "16/04/2026"
---

<div class="ix-cover">
<div class="ix-cover-logo">IMPACT <span class="x">X</span></div>
<p class="ix-cover-eyebrow">BENCHMARK · PRODUTO · UX</p>
<h1 class="ix-cover-title">Benchmark <span class="accent">Isaac</span></h1>
<p class="ix-cover-subtitle">Mineração de UX e features do maior player de gestão financeira escolar do Brasil — ideias para o Sistema Kumon Camargos.</p>
<p class="ix-cover-meta">16 DE ABRIL DE 2026 · RAFAEL CAMILLO · CONFIDENCIAL</p>
</div>

<nav id="TOC">
<ul>
<li><a href="#sumario-executivo">01. Sumário Executivo</a></li>
<li><a href="#publico-alvo">02. Público-alvo: overlap &amp; divergência</a></li>
<li><a href="#features-copiar">03. Features que valem copiar</a></li>
<li><a href="#dores-mercado">04. Dores do mercado</a></li>
<li><a href="#modelo-comercial">05. Modelo comercial</a></li>
<li><a href="#recomendacoes">06. Recomendações de roadmap</a></li>
</ul>
</nav>

<div class="section-heading" id="sumario-executivo"><span class="num">01.</span> Sumário Executivo</div>

## Sumário Executivo {#sumario-executivo-h}

<p class="lead">O Isaac é a maior plataforma financeira para escolas privadas no Brasil — parte da Arco Educação, atende K-12 e faculdades. Modelo: antecipa recebíveis em troca de comissão sobre a mensalidade. Duas interfaces: <strong>Plataforma isaac</strong> (gestor) e <strong>meu isaac</strong> (família, mobile-first). Dominam backend financeiro, mas escorregam no atendimento por terceirização.</p>

<div class="metric-row">
<div class="metric"><div class="value">2.000+</div><div class="label">Escolas parceiras</div></div>
<div class="metric"><div class="value">650k</div><div class="label">Alunos impactados</div></div>
<div class="metric"><div class="value">R$5bi</div><div class="label">Garantidos/ano</div></div>
<div class="metric"><div class="value">8.3/10</div><div class="label">Reclame Aqui</div></div>
</div>

<div class="box-insight">
<span class="box-title">Tese</span>
Isaac domina o backend financeiro escolar, mas o suporte terceirizado gera ping-pong com as famílias (família ↔ escola ↔ Isaac). Nosso diferencial no Sistema Kumon: <strong>ticket system interno</strong> que mantém o orientador no comando da resolução, com escalação para Impact X via WhatsApp apenas quando o orientador não consegue resolver. A família nunca fala direto com o fornecedor do sistema.
</div>

<div class="section-heading" id="publico-alvo"><span class="num">02.</span> Público-alvo: overlap &amp; divergência</div>

## Público-alvo {#publico-alvo-h}

O Isaac atende escolas privadas K-12 e faculdades — **nunca franquias de reforço**. O overlap com o Sistema Kumon Camargos existe **apenas no módulo financeiro**. Tudo que envolve progresso, estágio, feedback semanal, farol de churn e regra dia 5 é território nosso.

| DIMENSÃO | ISAAC | KUMON CAMARGOS |
|----------|-------|----------------|
| Segmento | Escolas privadas K-12 + faculdades | Franquia Kumon (reforço) |
| Escala | 100+ alunos, múltiplas séries | 68 alunos, 1 unidade |
| Ciclo | Ano letivo, matrícula anual | Contínuo — entra e sai o ano todo |
| Financeiro | Mensalidade única por aluno | 4 tipos de cobrança (taxa, mens., multa, outros) |
| Cancelamento | Raro, ligado ao ano letivo | Frequente (41% saem em &lt;3 meses), regra dia 5 |
| Comunicação | Financeiro + apps pedagógicos separados (ClassApp) | Unificada (WA + sistema) |
| Suporte | Terceirizado (Isaac atende família direto) | Orientador atende, Impact X só no backoffice |

<div class="box-dica">
<span class="box-title">Conclusão</span>
Overlap real só no módulo financeiro. Para o resto, o Isaac é benchmark de <strong>execução e UX</strong>, não de feature-set.
</div>

<div class="section-heading" id="features-copiar"><span class="num">03.</span> Features que valem copiar</div>

## Features que valem copiar {#features-copiar-h}

Organizadas por prioridade de incorporação no roadmap do Sistema Kumon.

### P0 · Já previstas no PRD — Isaac mostra execução forte

<span class="priority p0">P0</span> **App mobile-first para a família** — o `meu isaac` usa login por CPF com magic link no primeiro acesso, mostra boletos/Pix/cartão em uma tela, negocia atraso em poucos cliques. Nosso **Dashboard Familiar** deve herdar essa clareza: uma tela, poucas ações, zero cognição desnecessária.

<span class="priority p0">P0</span> **Pagamento multi-canal (boleto + Pix + cartão)** — o PRD atual prevê boleto + Pix. Adicionar **cartão de crédito** (parcelável) aumenta adimplência mesmo em famílias apertadas. Isaac já comprovou essa tese no K-12.

<span class="priority p0">P0</span> **Negociação self-service pelo app da família** — família vê boleto em atraso, aperta "renegociar", escolhe parcelamento dentro de regras pré-configuradas pelo orientador. Libera a auxiliar de ficar negociando por WA.

### P1 · Ideias novas que ainda não estão no PRD

<div class="card-grid">
<div class="card">
<p class="card-eyebrow">P1 · NOVA</p>
<h4>Score de crédito do responsável</h4>
<p>Isaac consulta histórico de crédito do responsável financeiro antes de aprovar matrícula. No Kumon pode virar um <strong>fator adicional no Farol de Risco</strong> — não pra barrar matrícula, mas pra sinalizar famílias de maior risco de inadimplência já na entrada.</p>
</div>
<div class="card">
<p class="card-eyebrow">P1 · NOVA</p>
<h4>Gatilho contrato assinado → libera app</h4>
<p>No Isaac, contrato Docusign assinado → app da família é liberado automaticamente. No nosso fluxo (Autentique), o gatilho não está explícito. Amarrar <code>contract.status = assinado</code> ao <code>family_portal_access = true</code>.</p>
</div>
<div class="card">
<p class="card-eyebrow">P1 · NOVA</p>
<h4>Ticket system interno</h4>
<p>Família abre chamado no portal → orientador vê no dashboard → resolve na plataforma → família é notificada. Resolve o ping-pong do Isaac. Se orientador não resolve, escala pra Impact X via WA pessoal (B2B).</p>
</div>
<div class="card">
<p class="card-eyebrow">P1 · NOVA</p>
<h4>Venda integrada no app da família</h4>
<p>Isaac vende material didático dentro do <code>meu isaac</code>. No Kumon: livros extras, convites de evento, bolsa — usando o <code>type='outros'</code> que já existe na tabela <code>charges</code>. Família compra com 1 clique.</p>
</div>
</div>

### P2 · Nice-to-have, fora do MVP

<span class="priority p2">P2</span> **Módulo analytics com benchmark de mercado** — Isaac compara inadimplência/precificação da escola com escolas similares. Improvável replicar (precisa de dados agregados de muitas unidades), mas anotar para quando a Impact X tiver 10+ unidades no SaaS.

<span class="priority p2">P2</span> **Seguro Familiar via parceria** — Isaac tem parceria com Porto Seguro para garantir mensalidades em caso de óbito do responsável. Parceria futura boa para Impact X, mas fora do MVP.

<span class="priority p2">P2</span> **Integração com apps pedagógicos** — Isaac integra com ClassApp. Não se aplica direto ao Kumon porque o módulo pedagógico é nativo do nosso sistema (presença, feedbacks, metas, progresso).

<div class="section-heading" id="dores-mercado"><span class="num">04.</span> Dores do mercado</div>

## Dores do mercado {#dores-mercado-h}

Reclame Aqui da Isaac: **nota 8.3/10, 928 reclamações**. Nota boa, mas o padrão das queixas mostra a fragilidade do modelo.

| DOR | DESCRIÇÃO | IMPACTO |
|-----|-----------|---------|
| Cobrança indevida | Família matriculada em escola A recebe cobrança duplicada de ciclos anteriores | <span class="badge alto">Alto</span> |
| Divergência de valor | Escola combina X, Isaac emite Y | <span class="badge alto">Alto</span> |
| Ping-pong família ↔ escola ↔ Isaac | Família reclama na escola, escola passa pro Isaac, Isaac volta pra escola | <span class="badge alto">Alto</span> |
| Suporte lento via Zendesk | Resposta genérica, não conhece o contexto da unidade | <span class="badge medio">Médio</span> |
| App com login difícil no primeiro acesso | Famílias sem CPF no cadastro ficam fora | <span class="badge medio">Médio</span> |

<div class="box-atencao">
<span class="box-title">Oportunidade</span>
O ping-pong é a dor mais citada — e totalmente evitável no nosso modelo. A Impact X é <strong>fornecedora do sistema</strong>, não operadora da cobrança. O orientador é dono do atendimento; o sistema só precisa dar ferramentas pra ele resolver sem sair da plataforma.
</div>

### Nosso modelo de suporte (3 níveis)

| NÍVEL | QUEM | QUANDO | COMO |
|-------|------|--------|------|
| **L1** | Família | Qualquer dúvida/problema | Abre ticket no portal familiar + mensagem WA |
| **L2** | Orientador da unidade | Todo ticket da família | Vê no dashboard, resolve na plataforma (cobrança, contrato, acesso), responde pelo sistema + WA |
| **L3** | Impact X | Só quando L2 escala | WhatsApp pessoal do orientador pra equipe Impact X. Nunca contato direto com família |

<div class="section-heading" id="modelo-comercial"><span class="num">05.</span> Modelo comercial</div>

## Modelo comercial {#modelo-comercial-h}

<div class="box-resumo">
<span class="box-title">Referência — não replicar</span>
Isaac cobra <strong>comissão sobre mensalidades antecipadas</strong> (% não divulgado publicamente). Modelo casa com escolas K-12 de ticket médio alto e fluxo previsível. Não cabe no Kumon: volume menor, mensalidades menores, ticket médio inadequado pra fintech de recebíveis.
</div>

**Nosso modelo (Impact X):** SaaS B2B com assinatura por unidade — licença mensal ou anual paga pelo orientador. Camargos é o **piloto** (tração inicial). Ao validar, expandir para outras unidades Kumon e depois para outras franquias de reforço (Wizard, CCAA, Fisk).

<div class="section-heading" id="recomendacoes"><span class="num">06.</span> Recomendações de roadmap</div>

## Recomendações de roadmap {#recomendacoes-h}

Amarradas às 3 fases do MVP definidas no PRD do Sistema Kumon.

| AÇÃO | FASE MVP | PRIORIDADE | OBSERVAÇÃO |
|------|----------|------------|------------|
| Dashboard Familiar mobile-first (clareza estilo `meu isaac`) | Fase 1 · Core | <span class="priority p0">P0</span> | Já previsto, elevar qualidade visual |
| Gatilho contrato assinado → libera portal da família | Fase 2 · Gestão | <span class="priority p1">P1</span> | Amarrar <code>contract.status</code> ao <code>family_portal_access</code> |
| Pagamento via cartão de crédito (além de boleto/Pix) | Fase 3 · Financeiro | <span class="priority p0">P0</span> | Elevar adimplência; parceria com adquirente |
| Negociação self-service pela família | Fase 3 · Financeiro | <span class="priority p0">P0</span> | Regras pré-configuráveis pelo orientador |
| Ticket system interno (família → orientador → Impact X) | Fase 2 · Gestão | <span class="priority p1">P1</span> | Feature nova, não estava no PRD |
| Score de crédito como fator do Farol de Risco | Fase 3 · Financeiro | <span class="priority p1">P1</span> | Consulta ao responsável na matrícula |
| Venda de material/eventos dentro do portal familiar | Fase 3 · Financeiro | <span class="priority p1">P1</span> | Reaproveita <code>type='outros'</code> de <code>charges</code> |
| Analytics com benchmark entre unidades | Pós-MVP | <span class="priority p2">P2</span> | Só faz sentido com 10+ unidades no SaaS |

---

*Feito por Impact X — Rafael Camillo · rafael@impactxlab.com*
