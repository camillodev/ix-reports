# IX Reports

**Impact X** — Relatórios e documentos publicados via Vercel.

## URLs

| URL | Uso |
|-----|-----|
| **https://reports.impactxlabs.com/** | Custom domain (principal) |
| **ix-reports.vercel.app** | Vercel default URL |

## Como funciona

Este repositório serve HTML estático via **Vercel**. Zero build, zero framework, zero manutenção. Deploy automático a cada push no `master`. Deploy previews automáticos por branch/PR.

### Fluxo de publicação

```
1. Claude gera relatório HTML com identidade Impact X
2. Push do arquivo via GitHub MCP → camillodev/ix-reports (branch master)
3. Vercel detecta push e faz deploy automaticamente
4. Link público: https://reports.impactxlabs.com/[nome-do-arquivo].html
```

### Estrutura do repo

```
ix-reports/
├── README.md           ← Este arquivo
├── index.html          ← Página de listagem (Bootstrap 5.3 + filtros)
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

Depois, atualizar `index.html` adicionando o card do novo report **com tags obrigatórias**.

### Tags obrigatórias

Todo novo report **deve** incluir tags no `index.html`. Isso garante que o filtro de busca funcione corretamente.

#### Como adicionar tags a um novo report

1. Adicione o atributo `data-tags` no `<div class="card report-card">` com tags separadas por vírgula:

```html
<div class="card report-card h-100" data-tags="impact-x,diagnostico-2026,financeiro">
```

2. Adicione badges dentro do card:

```html
<div class="d-flex flex-wrap gap-1 mt-2">
  <span class="badge tag-empresa">IMPACT X</span>
  <span class="badge tag-projeto">DIAGNÓSTICO 2026</span>
  <span class="badge tag-area">FINANCEIRO</span>
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

Novas tags podem ser criadas — basta adicionar um novo `<button class="chip">` na seção de filtros do `index.html`.

---

Feito por **Impact X** — Rafael Camillo
