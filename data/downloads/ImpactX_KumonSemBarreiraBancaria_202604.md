---
title: "Kumon-app — Cobrança Sem Barreira Bancária"
subtitle: "Impact X · Abril 2026 · Confidencial"
author: "Rafael Camillo"
date: "17/04/2026"
---

<div class="ix-cover">
<div class="ix-cover-logo">IMPACT <span class="x">X</span></div>
<h1 class="ix-cover-title">Cobrança sem forçar cliente a abrir <span class="accent">conta</span></h1>
<p class="ix-cover-subtitle">Como emitir boleto e PIX das escolas usando o banco que elas já têm — sem custo fixo, sem virar banco.</p>
<p class="ix-cover-meta">17 DE ABRIL DE 2026 · RAFAEL CAMILLO · CONFIDENCIAL</p>
</div>

<nav id="TOC">
<ul>
<li><a href="#sumario-executivo">Sumário Executivo</a></li>
<li><a href="#pergunta-central">A Pergunta Central</a></li>
<li><a href="#caminhos">Os Caminhos Possíveis</a></li>
<li><a href="#comparativo">Comparativo Direto</a></li>
<li><a href="#recomendacao">Recomendação</a></li>
<li><a href="#proximos-passos">Próximos Passos</a></li>
</ul>
</nav>

<div class="section-heading" id="sumario-executivo"><span class="num">01.</span> Sumário Executivo</div>

<p class="lead">A decisão de manter Cora como banco principal está mantida. A pergunta nova é: **como fazer a escola não precisar abrir conta nova só pra usar nosso sistema?** Pesquisamos todas as alternativas — APIs diretas dos bancos, Open Finance, Pix Automático, BaaS. Existe um caminho legal e viável, mas só em 2 ou 3 bancos brasileiros. O resto do mercado vai exigir que a escola abra conta em um banco recomendado por nós (Stark Bank, 1 a 3 dias).</p>

<div class="metric-row">
  <div class="metric"><div class="value">2</div><div class="label">Bancos com API pronta</div></div>
  <div class="metric"><div class="value">R$ 0</div><div class="label">Custo fixo pra nós</div></div>
  <div class="metric"><div class="value">1-3 dias</div><div class="label">Abrir Stark (fallback)</div></div>
</div>

<div class="box-resumo">
<span class="box-title">A resposta em uma frase</span>
O modelo que o Rafa imagina — "me dá credencial do seu banco, eu emito em nome da escola" — **existe e é legal**, mas só funciona bem em Banco Inter e Sicoob. Pra todo o resto, a saída menos dolorosa é abrir Stark Bank em 1 dia. BaaS (Celcoin, Matera) está descartado porque nos transformaria em banco.
</div>

<div class="section-heading" id="pergunta-central"><span class="num">02.</span> A Pergunta Central</div>

## A Pergunta Central {#pergunta-central}

**"Consigo emitir cobrança em nome da escola usando o banco que ela já tem, sem obrigar ninguém a abrir conta nova, sem virar banco e sem custo fixo pra mim?"**

Por que isso importa:

- A escola já tem vida bancária montada (movimentação, DAS, folha). Mudar de banco é fricção real.
- Se eu obrigar a escola a abrir Cora, perco 10–30% dos leads só nessa etapa.
- Se eu virar "banco intermediário" (modelo BaaS), caio em regulação do Bacen e o dinheiro das escolas passa pela minha conta — risco jurídico e fiscal altíssimo pra startup.

O ideal: a escola continua no banco dela, gera uma credencial de API, me entrega, e eu emito boleto/PIX em nome dela direto na conta dela. É exatamente como Omie e Conta Azul operam.

<div class="section-heading" id="caminhos"><span class="num">03.</span> Os Caminhos Possíveis</div>

## Os Caminhos Possíveis {#caminhos}

Três estratégias foram avaliadas:

### Caminho A — API direta do banco da escola

A escola acessa o internet banking PJ, gera certificado digital + chaves de API com permissão de cobrança, e me entrega. Eu integro.

<span class="priority p0">RECOMENDADO</span> Funciona bem em **Banco Inter** e **Sicoob**. Ambos têm API pública, self-service, madura, com sandbox, docs e mTLS padrão. Banco do Brasil também funciona, porém o fluxo de convênio é mais burocrático.

Limitação: cada banco tem seu jeito. Itaú, Bradesco, Santander exigem contrato comercial e homologação de semanas — não rola pro MVP.

### Caminho B — Open Finance / Pix Automático via agregador

Um intermediário (Pluggy, Belvo) conecta em 100+ bancos via Open Finance e me entrega uma API única. A escola autoriza via tela do Open Finance, eu não preciso de credencial manual.

<span class="priority p2">FALLBACK EM ESCALA</span> Custo: Pluggy cobra R$ 2.500/mês de plano base. Só faz sentido quando tivermos **mais de 20 escolas** no sistema. Belvo não publica preço (homologação comercial).

Pix Automático (obrigatório desde out/2025) é ótimo pra recorrência, mas tecnicamente exige um ITP (Iniciador de Pagamento) certificado pelo Bacen — então usaríamos via Pluggy/parceiro.

### Caminho C — BaaS (Banking as a Service)

Provedores como Celcoin, Matera, Transfeera me dariam uma "conta-mãe" que eu administro, e eu criaria "subcontas" pra cada escola.

<span class="priority p2">DESCARTADO</span> Parece atraente mas nos transforma em instituição de pagamento. O dinheiro das escolas passa pela nossa conta — precisa KYC, compliance, AML, eventual licença Bacen. Onboarding de meses, risco regulatório, mensalidade alta. Não vale no estágio atual.

<div class="box-atencao">
<span class="box-title">Sobre a Cora</span>
Confirmado: **Cora é 1 CNPJ por conta, não é compartilhável**. Não existe modo "minha conta Cora emitindo pra N escolas" — se eu tentar, o dinheiro cairia no meu CNPJ e viraria escrow, que é exatamente o modelo BaaS que queremos evitar. Cora continua sendo o banco recomendado pra quem vai abrir conta, mas **não resolve o problema de zero barreira**.
</div>

<div class="section-heading" id="comparativo"><span class="num">04.</span> Comparativo Direto</div>

## Comparativo Direto {#comparativo}

Bancos com API pública pra emissão de cobrança em nome do cliente PJ:

| Banco | API pronta? | Abrir conta nova? | Onboarding | Tarifa boleto | Mensalidade | DX |
|-------|-------------|-------------------|------------|---------------|-------------|-----|
| **Banco Inter** | Sim, madura | Não, se já é cliente | Imediato (gera cert no app) | R$ 2,50 (muitos planos 100 grátis/mês) | R$ 0 | Alta |
| **Sicoob** | Sim, muito usada por ERPs | Só se não for cooperado | Dias, se precisar abrir | R$ 1,50–2,50 | R$ 0–30 | Alta |
| **Banco do Brasil** | Sim | Não, se já é cliente | Convênio leva semanas | R$ 2–4 | Cesta PJ | Média (burocrática) |
| **Stark Bank** | API-first, referência BR | Sim, sempre | **1–3 dias** | R$ 1–2 | R$ 0 | Muito alta |
| **Cora** | Sim, madura | Sim, sempre (1 CNPJ = 1 conta) | 10–30 min | R$ 0 (até limite) | R$ 0 | Alta |
| Itaú / Bradesco / Santander | Sim, mas gated | Não, se já é cliente | **Semanas** (homologação) | Não publicado | Cesta PJ | Baixa |
| Caixa | Sim (SIGCB legado) | Não | Lento | ~R$ 2,50 | Cesta | Baixa |

Agregadores Open Finance:

| Provedor | Cobertura | Custo | Quando usar |
|----------|-----------|-------|-------------|
| **Pluggy** | 100+ bancos BR | R$ 2.500/mês | A partir de 20 escolas |
| **Belvo** | BR + LatAm | Sob consulta (homologação) | Quando precisar LatAm |
| **Klavi / Quanto** | BR | Sob consulta | Alternativas a Pluggy |

<div class="section-heading" id="recomendacao"><span class="num">05.</span> Recomendação</div>

## Recomendação {#recomendacao}

Estratégia em camadas — começa simples, cresce conforme demanda:

<span class="priority p0">P0 — MVP (primeiras 10 escolas)</span> Integrar **Banco Inter + Sicoob + Cora**. Cobre cerca de 80% das PME brasileiras. A escola escolhe: "uso meu Inter/Sicoob" ou "abro uma Cora". Zero custo fixo pra nós, zero mensalidade.

<span class="priority p1">P1 — Fallback pra quem não quer nenhum dos três</span> **Stark Bank** como banco recomendado. Onboarding de 1–3 dias, API é a melhor do Brasil, suporta múltiplos workspaces (nós orquestramos N escolas de uma base de código só). Venda: "abre uma Stark em 1 dia, resolve".

<span class="priority p1">P1 — V2 (a partir de 20 escolas)</span> Plugar **Pluggy** como agregador pros bancos fora da lista (Itaú, Bradesco, Santander, etc.). Paga R$ 2.500/mês e ganha cobertura de 100+ bancos em uma API. Só faz sentido quando volume justificar — antes disso é caro demais.

<span class="priority p2">P2 — Backlog</span> Pix Automático via ITP parceiro, APIs diretas dos bancões (Itaú/Bradesco/Santander) conforme demanda específica chegar.

<div class="box-insight">
<span class="box-title">Insight-chave</span>
A venda muda: em vez de "abra conta na Cora pra usar nosso sistema", a oferta passa a ser **"continue no seu banco — se for Inter, Sicoob ou BB, já funciona. Se for outro, abra Stark em 1 dia"**. Remove o maior atrito de onboarding sem nos transformar em instituição financeira.
</div>

<div class="box-dica">
<span class="box-title">O que não fazer</span>
Não ir de BaaS (Celcoin, Matera, Transfeera) — nos transformaria em instituição de pagamento, com dinheiro das escolas passando pela nossa conta. Risco regulatório alto, onboarding de meses, compliance pesado. Fica no radar só se um dia quisermos virar fintech, não agora.
</div>

<div class="section-heading" id="proximos-passos"><span class="num">06.</span> Próximos Passos</div>

## Próximos Passos {#proximos-passos}

| Ação | Responsável | Prazo |
|------|-------------|-------|
| Validar credencial Inter PJ com escola-piloto (abrir app, gerar cert) | <span class="owner-badge rafa">Rafa</span> | 24/04 |
| Prototipar adapter Inter (`src/lib/integration/inter/`) | <span class="owner-badge rafa">Rafa</span> | 02/05 |
| Prototipar adapter Sicoob | <span class="owner-badge rafa">Rafa</span> | 09/05 |
| Abstração `BillingProvider` (Cora + Inter + Sicoob) | <span class="owner-badge rafa">Rafa</span> | 16/05 |
| [P1] Criar conta Stark Bank e validar multi-workspace | <span class="owner-badge rafa">Rafa</span> | Pós-MVP |
| Decidir Pluggy só quando 15+ escolas estiverem no pipeline | <span class="owner-badge rafa">Rafa</span> | Condicional |

---
*Feito por Impact X — Rafael Camillo*
