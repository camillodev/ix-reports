# IX Reports

**Impact X** — Relatórios e documentos publicados via GitHub Pages.

## URLs

| URL | Uso |
|-----|-----|
| **https://reports.impactxlabs.com/** | Custom domain (principal) |
| **https://camillodev.github.io/ix-reports/** | Fallback (redireciona pro custom domain) |

## Como funciona

Este repositório serve HTML estático via **GitHub Pages**. Zero build, zero framework, zero manutenção.

### Fluxo de publicação

```
1. Claude gera relatório HTML com identidade Impact X
2. Push do arquivo via GitHub MCP → camillodev/ix-reports (branch master)
3. GitHub Pages serve automaticamente
4. Link público: https://reports.impactxlabs.com/[nome-do-arquivo].html
```

### Estrutura do repo

```
ix-reports/
├── README.md           ← Este arquivo
├── CNAME               ← Custom domain (reports.impactxlabs.com)
├── index.html          ← Página de listagem de todos os reports
└── ImpactX_*.html      ← Relatórios individuais
```

### Naming convention

Todos os reports seguem o padrão:

```
ImpactX_[NomeDoRelatorio]_[AAAAMM].html
```

Exemplos:
- `ImpactX_PropostaG2I_202603.html`
- `ImpactX_PipelineReview_202603.html`
- `ImpactX_SystemDesignAuth_202603.html`

### Identidade visual

- **Cores**: Preto `#0A0A0A` + Verde `#42593D` + Amarelo `#F2C94C`
- **Font**: Roboto (Google Fonts CDN)
- **O "X"**: sempre amarelo `#F2C94C`
- **Rodapé**: "Feito por Impact X — Rafael Camillo"

### Como adicionar um novo report

Via GitHub MCP (automatizado pelo Claude):

```
owner: camillodev
repo: ix-reports
path: ImpactX_NomeDoReport_AAAAMM.html
branch: master
```

Depois, atualizar `index.html` adicionando o link do novo report **com tags obrigatórias**.

### Tags obrigatórias

Todo novo report **deve** incluir tags no `index.html`. Isso garante que o filtro de busca funcione corretamente.

#### Como adicionar tags a um novo report

1. Adicione o atributo `data-tags` no `<a class="report-link">` com tags separadas por vírgula:

```html
<a class="report-link" href="ImpactX_NomeDoReport_AAAAMM.html"
   data-tags="impact-x,diagnostico-2026,financeiro">
```

2. Adicione tags visuais dentro de uma `<div class="tags-row">`:

```html
<div class="tags-row">
  <span class="tag tag-empresa">IMPACT X</span>
  <span class="tag tag-projeto">DIAGNÓSTICO 2026</span>
  <span class="tag tag-area">FINANCEIRO</span>
</div>
```

3. Cada report deve ter no mínimo: **1 empresa**, **1 projeto** e **1 área**.

#### Tags disponíveis

**Empresa** (`tag-empresa` · amarelo):

| Slug | Label |
|------|-------|
| `impact-x` | Impact X |
| `kumon` | Kumon |
| `g2i` | G2i |
| `wy` | Wy |

**Projeto** (`tag-projeto` · roxo):

| Slug | Label |
|------|-------|
| `diagnostico-2026` | Diagnóstico 2026 |
| `vto-eos` | VTO/EOS |
| `institucional` | Institucional |
| `ingles-kumon` | Inglês Kumon |
| `g2i-interview` | G2i Interview |
| `skills-v2` | Skills v2 |

**Área** (`tag-area` · verde):

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

Novas tags podem ser criadas — basta adicionar um novo `<button class="chip">` na seção `.filter-bar` do `index.html`.

---

Feito por **Impact X** — Rafael Camillo
