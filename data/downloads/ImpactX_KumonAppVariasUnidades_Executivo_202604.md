---
title: "Kumon-app para Várias Unidades — Versão Executiva"
subtitle: "Impact X · Abril 2026 · Confidencial"
author: "Rafael Camillo"
date: "17/04/2026"
---

<div class="ix-cover">
<div class="ix-cover-logo">IMPACT <span class="x">X</span></div>
<h1 class="ix-cover-title">Kumon-app para <span class="accent">Várias Unidades</span></h1>
<p class="ix-cover-subtitle">Como transformar o app em ferramenta pra franquias, escolas e cursos livres — versão executiva sem jargão.</p>
<p class="ix-cover-meta">17 DE ABRIL DE 2026 · RAFAEL CAMILLO · CONFIDENCIAL</p>
</div>

<nav id="TOC">
<ul>
<li><a href="#o-problema">O Problema</a></li>
<li><a href="#como-esta-hoje">Como Está Hoje</a></li>
<li><a href="#opcoes-de-cobranca">Opções de Cobrança</a></li>
<li><a href="#opcoes-de-nota-fiscal">Opções de Nota Fiscal</a></li>
<li><a href="#quanto-custa">Quanto Custa</a></li>
<li><a href="#recomendacao">Recomendação</a></li>
<li><a href="#plano-de-execucao">Plano de Execução</a></li>
</ul>
</nav>

<div class="section-heading" id="o-problema"><span class="num">01.</span> O Problema</div>

<p class="lead">Hoje o <strong>kumon-app</strong> atende só uma unidade: a Camargos. A ideia é vender pra franquias Kumon, escolas e cursos livres em geral — cada escola com sua própria conta bancária, cobrando as mensalidades dos alunos e emitindo a nota fiscal pra prefeitura. A pergunta central: vale construir mais coisa por conta própria, ou plugar em ferramentas que já existem?</p>

<div class="metric-row">
  <div class="metric"><div class="value">1 → N</div><div class="label">Unidades atendidas</div></div>
  <div class="metric"><div class="value">R$ 548</div><div class="label">Custo/mês p/ 50 escolas</div></div>
  <div class="metric"><div class="value">2,5 sem</div><div class="label">Tempo pra 2ª escola entrar</div></div>
</div>

<div class="section-heading" id="como-esta-hoje"><span class="num">02.</span> Como Está Hoje</div>

## Como está hoje {#como-esta-hoje-section}

### O que já funciona bem

- A integração com o **Cora** (banco digital pra PJ) emite boleto, recebe PIX e emite nota fiscal automática. Tá maduro, rodando em produção.
- O fluxo de fatura (de "rascunho" até "paga") está fechado e com tratamento de erro.
- A emissão de nota fiscal existe — hoje todo mês a unidade Camargos gera nota fiscal automaticamente pela Cora.

### O que falta pra atender várias escolas

<div class="box-atencao">
<span class="box-title">Atenção</span>
O sistema inteiro está <strong>amarrado a uma escola só</strong>. Nenhum cadastro no banco de dados separa "qual escola é dona desse aluno, dessa fatura, desse pagamento". Configuração da unidade (nome, CNPJ, preços) é uma linha única hardcoded. Se outra escola entrar hoje, os dados se misturam.
</div>

E tem um detalhe importante: a **nota fiscal pelo Cora só funciona em cidades específicas** que o Cora homologou. Se uma escola de uma cidade fora da lista quiser entrar, ela não consegue emitir nota.

<div class="section-heading" id="opcoes-de-cobranca"><span class="num">03.</span> Opções de Cobrança</div>

## Opções de cobrança {#opcoes-de-cobranca-section}

Comparei 7 bancos/gateways que cobram boleto e PIX no Brasil. O modelo que faz sentido: **cada escola abre a própria conta PJ** e o app guarda as credenciais de cada uma pra emitir as cobranças em nome delas.

| Opção | Custo por boleto | Custo do PIX | Suporta várias escolas? | Emite nota fiscal? | Observação |
|---|---|---|---|---|---|
| **Cora** (atual) | R$ 0 | R$ 0 | Sim, mas cada escola abre conta própria | Sim, mas cobertura limitada | Grátis, já está pronto |
| **Asaas** | R$ 1,99 | 0,99% | Sim — subcontas "white-label" | Sim, cobre 5 mil cidades | Único com tudo num lugar só |
| **AbacatePay** | R$ 1,99 | 0,80% | Parcial | Não | Fundado em 2024, cobertura menor |
| **Iugu** | R$ 2,90 + 2,49% | ~0,99% | Sim | Não | Caro, instabilidade reportada |
| **Pagar.me** | R$ 3,49 | 0,99% | Sim | Não | Stone é robusto, mas caro sem volume |
| **Mercado Pago** | R$ 3,49 | 0,99% | Sim | Não | Cada escola precisa ter conta ML ativa |
| **Stripe Brasil** | — | ~1,2% | Sim | Não | **Descartado** — não serve pra boleto recorrente BR |

<div class="box-insight">
<span class="box-title">Insight</span>
<strong>Cora continua imbatível em custo</strong>: zero fee. A pegadinha é que cada escola precisa abrir sua própria conta PJ no Cora (processo de dias/semanas). <strong>Asaas</strong> é o único concorrente real — resolve tudo num contrato só (cobrança + nota fiscal + divisão de pagamento entre escolas), mas cobra 0,99% em cima de cada PIX recebido, o que explode o custo em escala.
</div>

<div class="section-heading" id="opcoes-de-nota-fiscal"><span class="num">04.</span> Opções de Nota Fiscal</div>

## Opções de nota fiscal {#opcoes-de-nota-fiscal-section}

**Contexto importante:** no Brasil, cada prefeitura tem o próprio sistema de nota fiscal de serviço (são mais de 5.000 municípios). Integrar direto com todas é inviável. A partir de janeiro de 2026 entrou em vigor a **NFS-e Nacional** — um padrão único que unifica o país. Mas a adesão é gradual.

A saída é usar um **emissor de nota fiscal** — uma empresa que já fez integração com várias prefeituras e oferece uma API única pra gente.

| Opção | Preço por nota | Mensalidade mínima | Cobertura | Homologar cidade nova |
|---|---|---|---|---|
| **Focus NFe** | **R$ 0,10** | R$ 89,90 (100 notas) → R$ 548 (4 mil) | 1.400+ cidades + Nacional | **15 dias, R$ 199 fixo** |
| **NFE.io** | Sem preço público | R$ 179 (250) → R$ 349 (1 mil) | "Milhares" + Nacional | Só via comercial |
| **PlugNotas** | Não publicado | Não publicado | 3.400+ via Nacional | Não publicado |
| **Enotas** | R$ 0,37 a R$ 0,77 | + R$ 179 de adesão | Capitais + ~1.000 | Fila lenta |
| **Cora** (atual) | R$ 0 | R$ 0 | **Estreita** — só conveniadas | Cora controla, sem prazo |

<div class="box-dica">
<span class="box-title">Dica</span>
<strong>Focus NFe</strong> ganha em tudo que importa: menor preço por nota, documentação aberta (não precisa falar com vendedor), e é o único com <strong>prazo contratual</strong> pra cadastrar cidade nova — 15 dias por R$ 199 fixo, sem surpresa.
</div>

<div class="section-heading" id="quanto-custa"><span class="num">05.</span> Quanto Custa</div>

## Quanto custa {#quanto-custa-section}

Estimativa: cada escola tem em média 80 alunos pagando mensalidade, ticket médio R$ 500. Distribuição típica: 20% pagam boleto, 80% pagam PIX.

### Cenário A — Só Cora (grátis, mas com limite)

| Tamanho | Cobrança | Nota fiscal | Total por mês |
|---|---|---|---|
| 10 escolas | R$ 0 | R$ 0 | **R$ 0** |
| 50 escolas | R$ 0 | R$ 0 | **R$ 0** |
| 200 escolas | R$ 0 | R$ 0 | **R$ 0** |

<span class="priority p0">Risco</span> Se a cidade da escola não tá na lista do Cora, ela simplesmente não entra. Limita o mercado endereçável.

### Cenário B — Cora + Focus NFe (recomendado)

| Tamanho | Cobrança | Nota fiscal | Total por mês |
|---|---|---|---|
| 10 escolas | R$ 0 | R$ 90 | **R$ 90** |
| 50 escolas | R$ 0 | R$ 548 | **R$ 548** |
| 200 escolas | R$ 0 | R$ 1.988 | **R$ 1.988** |

<span class="priority p1">Ganho</span> Cobertura nacional + SLA pra novas cidades. Desamarra nota fiscal do banco.

### Cenário C — Asaas fazendo tudo

| Tamanho | Boleto | PIX (0,99% sobre R$ 500) | Plano | Total por mês |
|---|---|---|---|---|
| 10 escolas | R$ 318 | R$ 3.168 | R$ 49 | **R$ 3.535** |
| 50 escolas | R$ 1.592 | R$ 15.840 | R$ 129 | **R$ 17.561** |
| 200 escolas | R$ 6.368 | R$ 63.360 | R$ 129 | **R$ 69.857** |

<div class="box-atencao">
<span class="box-title">Atenção</span>
O % do PIX no Asaas é caro. Esse custo pode ser <strong>repassado pra escola</strong> (ela que absorve na fatura) ou <strong>absorvido pela Impact X</strong> (inviabiliza margem). É uma decisão comercial antes de tudo, não técnica.
</div>

<div class="section-heading" id="recomendacao"><span class="num">06.</span> Recomendação</div>

## Recomendação {#recomendacao-section}

<span class="priority p0">P0</span> **Continuar com o Cora pra cobrança.** É grátis, está pronto, não faz sentido reescrever tudo.

<span class="priority p0">P0</span> **Adicionar o Focus NFe pra emitir nota fiscal de qualquer cidade.** O Cora continua como plano B onde já funciona, sem custo extra. Escolher por escola no cadastro.

<span class="priority p0">P0</span> **Criar o cadastro de "Escola/Unidade" no sistema.** Adicionar o campo "qual escola" em todas as tabelas (aluno, responsável, fatura, nota fiscal, configuração, despesa). Usar o Clerk — a ferramenta de login que já tá no projeto — pra separar os dados por escola automaticamente.

<span class="priority p1">P1</span> **Organizar o código em "adaptadores" trocáveis.** Hoje tudo é Cora hardcoded. Vai virar: o sistema fala com uma "interface genérica" de cobrança e de nota fiscal, e cada escola escolhe quem usa. Plugar outro banco no futuro vira trivial.

<span class="priority p2">P2</span> **Asaas fica pra versão 1.1.** Útil quando alguma escola não quiser abrir conta Cora (cursos livres de cidade pequena, infoprodutos). Não vale a pena no MVP.

<div class="section-heading" id="plano-de-execucao"><span class="num">07.</span> Plano de Execução</div>

## Plano de execução {#plano-de-execucao-section}

| Fase | O que entrega | Tempo |
|---|---|---|
| **F1** | Banco de dados: novo cadastro "Escola" + campo "qual escola" em 8 tabelas | 2–3 dias |
| **F2** | Todas as consultas passam a filtrar por escola + login separado via Clerk | 2–3 dias |
| **F3** | Camada de "adaptadores" trocáveis pra cobrança e nota fiscal | 2 dias |
| **F4** | Adaptador Focus NFe + tela pra escolher emissor por escola | 3 dias |
| **F5** | Autenticação do webhook do Cora + proteção contra cruzar dados entre escolas | 1 dia |
| **F6** | Fluxo de onboarding pra nova escola entrar (abrir Cora, cadastrar prefeitura, testar) | 3–5 dias |

**Total: ~2,5 semanas focadas pra 2ª escola entrar no sistema.**

## Riscos e pontos abertos {#riscos-section}

<div class="alert-card red">
<div class="alert-title">Webhook pode cruzar dados entre escolas</div>
<div class="alert-desc">O código atual do webhook do Cora acha a fatura pelo ID sem checar a qual escola pertence. Se duas escolas tiverem IDs colidindo, dá pra uma corromper dados da outra. Tem que resolver antes da 2ª escola entrar.</div>
</div>

<div class="alert-card orange">
<div class="alert-title">Guardar certificado mTLS de cada escola</div>
<div class="alert-desc">Cada escola tem um certificado digital pra acessar o Cora. Armazenar isso com segurança pra várias escolas exige um cofre (KMS). Sem cofre, fica em disco criptografado — não ideal pra produção multi-cliente.</div>
</div>

<div class="alert-card yellow">
<div class="alert-title">Limite de requisições do Cora</div>
<div class="alert-desc">Já é dor com 1 escola. Com 50 vai piorar. Falar com o comercial do Cora antes de abrir pras primeiras escolas novas.</div>
</div>

## Próximos passos {#proximos-passos}

| Ação | Responsável | Prazo |
|---|---|---|
| Aprovar decisão Cora + Focus NFe | <span class="owner-badge rafa">Rafa</span> | 18/04 |
| Falar com comercial do Cora sobre limites | <span class="owner-badge rafa">Rafa</span> | 22/04 |
| Abrir conta sandbox no Focus NFe | <span class="owner-badge rafa">Rafa</span> | 22/04 |
| Começar F1 (cadastro de Escola) | <span class="owner-badge ai">AI</span> | 23/04 |

---
*Feito por Impact X — Rafael Camillo*
