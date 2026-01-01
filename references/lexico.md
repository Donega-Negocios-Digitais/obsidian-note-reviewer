# Lexico da Skill nota-obsidian

Termos e definicoes usados nesta skill.

---

## Estrutura do Vault

| Termo | Definicao |
|:------|:----------|
| **Atlas** | Pasta raiz para conhecimento de terceiros (conteudos consumidos) |
| **Work** | Pasta raiz para conteudo criado pelo Alex |
| **Esforcos** | Pasta para projetos ativos e dashboards |
| **Calendario** | Pasta para notas diarias e jornadas |

## Tipos de Nota

| Termo | Definicao |
|:------|:----------|
| **Atomica** | Nota curta sobre um unico conceito (Zettelkasten) |
| **MOC** | Map of Content - indice que conecta notas relacionadas |
| **Dashboard** | Painel visual com metricas e links de um projeto |
| **Jornada** | Nota diaria com reflexoes e aprendizados |

## Pastas de Conteudo

| Pasta | Conteudo |
|:------|:---------|
| `Atlas/Conteudos/` | Resumos de conteudos de terceiros |
| `Atlas/Atomos/` | Conceitos atomicos e pessoas |
| `Atlas/Mapas/` | MOCs e indices |
| `Work/Conteudos Mestre/` | Artigos, prompts, checklists proprios |
| `Work/DNAs/` | Frameworks e metodologias proprias |
| `Work/Videos/` | Roteiros e notas de videos proprios |
| `Work/Newsletters/` | Edicoes de newsletters proprias |

## Regra de Autoria

| Origem | Destino |
|:-------|:--------|
| Conteudo de **terceiros** | `Atlas/Conteudos/[tipo]/` |
| Conteudo do **Alex** | `Work/[tipo]/` |

## Elementos das Notas

| Termo | Definicao |
|:------|:----------|
| **Frontmatter** | Bloco YAML no inicio da nota com metadados |
| **Wikilink** | Link interno no formato `[[Nome da Nota]]` |
| **Callout** | Bloco destacado com `> [!tipo]` |
| **Propriedades da nota** | Secao final com metadados de criacao |

## Blocos XML dos Templates

| Bloco | Funcao |
|:------|:-------|
| `<gerador-nota-*>` | Instrucoes para o Claude gerar a nota |
| `<exemplo-*>` | Exemplo de nota preenchida |
| `<frontmatter>` | Modelo do cabecalho YAML |
