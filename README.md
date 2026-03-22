# Relatorio X

Hub de relatorios da Impact X — reports.rafaelcamillo.com

## Stack

- HTML/CSS/JS puro (sem framework)
- Site estatico com deploy na Vercel

## Estrutura do Projeto

```
index.html              # Hub — sidebar com accordions + conteudo principal
assets/
  css/
    tokens.css          # Design tokens (cores, espacamento, z-index)
    hub.css             # Estilos do hub
    report.css          # Chrome compartilhado dos relatorios (topbar, tabs, tipografia)
    cmd-k.css           # Estilos da paleta de comandos
  js/
    hub.js              # Logica do hub (sidebar, filtros, accordions, router)
    cmd-k.js            # Paleta de comandos Cmd+K
    report.js           # JS compartilhado dos relatorios (tabs, botao voltar)
data/
  reports.json          # Registro de relatorios (titulo, slug, data, cliente, projeto, tags)
  clients.json          # Metadados de clientes/projetos (nome, cor, icone, projetos)
  *.html                # Arquivos individuais de relatorio
  downloads/            # Arquivos PDF/MD
scripts/
  test.mjs              # Testes de verificacao (JSON, estrutura HTML, arquivos)
vercel.json             # Regras de redirect (nomes antigos -> slugs novos)
```

## Funcionalidades

- **Sidebar com 3 accordions**: Clientes, Projetos e Tags
- **Filtros combinados**: por cliente, projeto e/ou tags
- **Visualizacao lista/grid**: toggle persistido em localStorage
- **Paleta de comandos**: Cmd+K para busca rapida
- **Tema claro/escuro**: toggle com persistencia
- **Paginacao**: no conteudo principal
- **Responsivo**: sidebar mobile com overlay

## Como rodar localmente

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Abrir http://localhost:8000

## Como adicionar um relatorio

1. Criar `data/seu-relatorio.html` seguindo o padrao (`data/plano-automacao.html`)
2. Adicionar entrada em `data/reports.json`
3. Rodar `node scripts/test.mjs` para validar
4. Se o `client` ou `project` nao existir em `data/clients.json`, adicionar

## Schema do reports.json

```json
{
  "title": "Titulo do Relatorio",
  "slug": "slug-do-relatorio",
  "file": "slug-do-relatorio.html",
  "date": "2026-03-22",
  "meta": "22 Mar 2026 · Descricao curta",
  "client": "impact-x",
  "project": "automacao",
  "tags": ["tech", "operacoes"],
  "icon": "file-earmark-text",
  "type": "html",
  "num": "01",
  "description": "Descricao opcional mais longa",
  "status": "published",
  "pinned": false
}
```

- **Obrigatorios**: `title`, `slug`, `file`, `date`, `client`, `tags`, `type`
- **Opcionais**: `meta`, `project`, `icon`, `num`, `description`, `status`, `pinned`, `quarter`

## Deploy

Push para a branch `master`. A Vercel faz deploy automatico.

## Testes

```bash
node scripts/test.mjs
```

Valida schemas JSON, existencia de arquivos, estrutura HTML dos relatorios, arquivos do hub e redirects da Vercel.
