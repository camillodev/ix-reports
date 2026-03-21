# IX Reports — Impact X

Repositório de **relatórios HTML estáticos** e hub de navegação. Serve como referência operacional para humanos e para LLMs que criem ou atualizem documentos neste padrão.

## Visão geral

| Item | Detalhe |
|------|---------|
| Deploy | [Vercel](https://vercel.com) — push em `master` dispara deploy |
| Hub | `/` → `index.html` (lista, filtros por tags) |
| Relatórios | `data/ImpactX_*.html` (maioria) ou na raiz (ex.: `ImpactX_GuiaOri_202603.html`) |
| URLs públicas | **https://reports.impactxlabs.com/** · fallback `ix-reports.vercel.app` |

Fluxo típico: criar/atualizar HTML → commit/push → Vercel publica. Sem build step para o conteúdo dos relatórios.

## Estrutura do repositório

```
ix-reports/
├── README.md
├── index.html                 # Hub (Bootstrap + filtros)
├── package.json
├── ImpactX_GuiaOri_202603.html   # Exceção na raiz (paths assets/ sem ../)
├── assets/
│   ├── css/
│   │   ├── hub.css            # Apenas o hub
│   │   └── report.css         # Tema compartilhado dos relatórios
│   └── js/
│       └── report.js          # Abas, hash, botão voltar
├── data/
│   ├── ImpactX_*.html         # Relatórios (paths ../assets/...)
│   └── downloads/             # PDFs, MDs linkados no hub
└── scripts/
    ├── validate.mjs           # npm run validate
    └── migrate-report-layout.mjs   # Migração legada (referência)
```

## Identidade visual (obrigatória nos relatórios)

- **Cores (tema atual)**: verde fintech `#11C76F`, texto `#1A1D21`, fundo cinza-claro `#F4F6F9`, cards brancos; cantos generosos e sombras leves (estética próxima de apps tipo PicPay)
- **Chrome**: topbar e abas claras; aba ativa em “pill” verde com texto branco
- **Marca**: **X** em verde no logo; relatórios escuros (`ix-report-dark`) usam slate (`#1E293B`) com mesmo verde de acento
- **Fonte**: **Plus Jakarta Sans** (corpo e títulos nos relatórios e no hub); **Roboto Mono** para trechos monoespaçados (métricas, índice). Carregamento via `report.css` (`@import`) e/ou `<link>` no `<head>` do HTML.
- **Corpo**: mínimo **16px** efetivo; `body.ix-report` em `report.css` usa base maior (~18px) para legibilidade
- **Topo**: toda página de relatório deve ter **topbar** com voltar, link da marca para `/`, e título curto do documento

Relatórios com cores muito específicas (ex.: faixas por cidade) podem manter um `<style>` local **mínimo** além de `report.css`.

## Template HTML canônico (copiar e adaptar)

Arquivos em **`data/`** usam caminhos com `../`. Relatório na **raiz** do repo usa `assets/...` sem `../`.

### Relatório em `data/`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Impact X — TITULO_AQUI</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="../assets/css/report.css" rel="stylesheet">
<!-- Opcional: <style> mínimo só para exceções visuais deste arquivo </style> -->
</head>
<body class="ix-report">

<header class="topbar">
  <button type="button" class="back-btn" aria-label="Voltar">← Voltar</button>
  <a href="/" class="brand">IMPACT <span class="x">X</span></a>
  <span class="topbar-title">TITULO_AQUI</span>
</header>

<nav class="tab-nav" role="tablist">
  <button type="button" class="tab-btn active" data-tab="secao1">Seção 1</button>
  <button type="button" class="tab-btn" data-tab="secao2">Seção 2</button>
</nav>

<div class="tab-panel active" data-tab="secao1" role="tabpanel" aria-hidden="false">
  <div class="content">
    <!-- conteúdo -->
  </div>
</div>

<div class="tab-panel" data-tab="secao2" role="tabpanel" aria-hidden="true">
  <div class="content">
    <!-- conteúdo -->
  </div>
</div>

<footer>
  <div class="brand">IMPACT <span class="x">X</span></div>
  Feito por Impact X — Rafael Camillo
</footer>

<script src="../assets/js/report.js"></script>
</body>
</html>
```

### Regras de abas e JS

- Cada botão `.tab-btn` deve ter `data-tab="id"` (ou `data-ix-tab`).
- Cada painel `.tab-panel` correspondente deve ter o **mesmo** `data-tab="id"` (recomendado). O script também aceita painéis legados com classes `.tab-content` ou `.tc` e ids coerentes.
- URL hash (ex.: `#secao2`) sincroniza a aba ativa após carregar.
- **Voltar**: `.back-btn` usa `history.back()` e cai em `/` se não houver histórico.

### Abas automáticas (opcional)

Em um container com `data-auto-tabs`, `report.js` pode gerar abas a partir de seções — útil para documentos longos já estruturados em `<section id="...">`. Preferir abas explícitas quando o índice for editorialmente fixo.

## Como criar um novo relatório

1. Criar `data/ImpactX_[NomePascalCase]_AAAAMM.html` com o template acima (ou duplicar um relatório recente e limpar o conteúdo).
2. Garantir **topbar** + `report.css` + `report.js` + `body.ix-report`.
3. Definir uma aba por grande bloco do documento (cada `<h1>` / capítulo costuma virar uma aba).
4. Registrar no hub: em `index.html`, adicionar um `<a class="report-row" ...>` (ver bloco abaixo).
5. Rodar `npm run validate` e corrigir hrefs quebrados.

## Como atualizar um relatório existente

- **Pode mudar livremente**: texto, tabelas, markup **dentro** dos painéis.
- **Manter sempre**: topbar, link da marca para `/`, inclusão de `report.css` e `report.js` (salvo exceção documentada).
- **Título na topbar**: alinhar com `<title>` e, se aplicável, com o título exibido no hub.
- **Abas**: adicionar/remover pares `tab-btn` + `tab-panel` com o mesmo `data-tab`.
- **Não remover** o bloco de navegação padrão só para “simplificar” — isso quebra o padrão do site.

## Entrada no hub (`index.html`)

Copiar um `.report-row` existente e ajustar `href`, `data-tags` e textos:

```html
<a class="report-row" href="data/ImpactX_NOME_AAAAMM.html"
   data-tags="CLIENTE,PROJETO,TAG">
  <span class="rr-icon"><i class="bi bi-file-earmark-text"></i></span>
  <div class="rr-info">
    <div class="rr-title">TITULO</div>
    <div class="rr-meta">DD Mês AAAA · DESCRIÇÃO_CURTA</div>
  </div>
  <div class="rr-tags d-none d-md-flex">
    <span class="rr-tag rr-tag-empresa">CLIENTE</span>
    <span class="rr-tag rr-tag-projeto">PROJETO</span>
    <span class="rr-tag rr-tag-area">TAG</span>
  </div>
  <span class="rr-arrow">›</span>
</a>
```

- `data-tags`: slugs separados por vírgula, **sem espaços** (devem bater com os `data-filter` dos chips da sidebar).
- Todo relatório deve ter, no mínimo, **1 cliente**, **1 projeto** e **1 tag de área** coerentes com as tabelas abaixo.

## Publicação (Git)

Exemplo local:

```bash
git add data/ImpactX_Novo_AAAAMM.html index.html
git commit -m "Add report ImpactX_Novo_AAAAMM"
git push origin master
```

Se usar **GitHub MCP** ou automação, o destino típico é o repositório **camillodev/ix-reports**, branch **master**, paths como `data/ImpactX_....html` e `index.html` quando houver nova linha no hub.

## Naming convention

```
ImpactX_[NomeDoRelatorio]_[AAAAMM].html
```

`AAAAMM` = ano e mês da versão principal do documento (ex.: `202603`).

## Tags disponíveis (hub)

**Clientes** (`rr-tag-empresa`):

| Slug | Label |
|------|-------|
| `impact-x` | Impact X |
| `kumon` | Kumon |
| `g2i` | G2i |
| `pessoal` | Pessoal |

**Projetos** (`rr-tag-projeto`):

| Slug | Label |
|------|-------|
| `diagnostico-2026` | Diagnóstico 2026 |
| `vto-eos` | VTO/EOS |
| `institucional` | Institucional |
| `ingles-kumon` | Inglês Kumon |
| `g2i-interview` | G2i Interview |
| `skills-v2` | Skills v2 |
| `automacao` | Automação |
| `coworking` | Coworking |
| `concurso-ai` | Concurso AI |
| `conexoes-profundas` | Conexões Profundas |
| `espiritualidade` | Espiritualidade |

**Áreas / tags** (`rr-tag-area`):

| Slug | Label |
|------|-------|
| `estrategia` | Estratégia |
| `financeiro` | Financeiro |
| `people` | People |
| `operacoes` | Operações |
| `comercial` | Comercial |
| `cultura` | Cultura |
| `legal` | Legal |
| `tech` | Tech |
| `ritual` | Ritual |

Novas tags exigem um novo `<button class="chip" ...>` na sidebar de filtros do `index.html`, com `data-filter` igual ao slug usado em `data-tags`.

## Scripts npm

| Comando | Função |
|---------|--------|
| `npm run dev` | Serve o site em `http://localhost:3000` (arquivo estático) |
| `npm run validate` | Confere se cada `href` de `.report-row` aponta para arquivo existente |
| `npm run count` | Conta quantos HTML existem em `data/` |

---

Feito por **Impact X** — Rafael Camillo
