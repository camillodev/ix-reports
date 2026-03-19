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

Depois, atualizar `index.html` adicionando o link do novo report.

---

Feito por **Impact X** — Rafael Camillo
