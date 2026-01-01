# Anti-Patterns - Skill nota-obsidian

O que NAO fazer ao gerar notas.

---

## Estrutura da Nota

### ❌ Titulo seguido de codigo
```markdown
## Exemplo
```python
codigo aqui
```
```

### ✅ Correto
```markdown
## Exemplo

Este codigo demonstra como implementar a funcao:

```python
codigo aqui
```
```

---

### ❌ Bloco XML na nota final
```markdown
<gerador-nota-artigo>
Instrucoes aqui...
</gerador-nota-artigo>

# Titulo da Nota
```

### ✅ Correto
```markdown
# Titulo da Nota

Conteudo limpo sem XML.
```

---

### ❌ Frontmatter incompleto
```yaml
---
title: Minha Nota
---
```

### ✅ Correto
```yaml
---
title: Minha Nota
date: 2024-01-15
author: Nome do Autor
tags: [tag1, tag2]
source: URL ou referencia
status: processado
---
```

---

## Wikilinks

### ❌ Links genericos demais
```markdown
Veja mais em [[Conceitos]] e [[Ideias]].
```

### ✅ Correto
```markdown
Relacionado a [[Principio de Pareto]] e [[Lei de Parkinson]].
```

---

### ❌ Links inexistentes em massa
```markdown
[[Termo1]], [[Termo2]], [[Termo3]], [[Termo4]], [[Termo5]]...
```

### ✅ Correto
```markdown
Conecta com [[Nota Existente]] e sugere criar [[Novo Conceito Relevante]].
```

---

## Organizacao

### ❌ Conteudo de terceiros em Work/
```
Work/Conteudos Mestre/Resumo do Artigo do Fulano.md
```

### ✅ Correto
```
Atlas/Conteudos/Artigos/Resumo do Artigo do Fulano.md
```

---

### ❌ Conteudo proprio em Atlas/
```
Atlas/Conteudos/Artigos/Meu Framework VIDA.md
```

### ✅ Correto
```
Work/DNAs/Framework VIDA.md
```

---

### ❌ Caracteres invalidos no nome
```
Nota: Titulo com * e ? proibidos.md
```

### ✅ Correto
```
Nota - Titulo com caracteres validos.md
```

---

## Conteudo

### ❌ Resumo superficial
```markdown
## Resumo
O artigo fala sobre produtividade. E interessante.
```

### ✅ Correto
```markdown
## Resumo
O autor argumenta que produtividade real vem de eliminar tarefas,
nao de otimiza-las. Apresenta 3 principios: foco radical,
eliminacao sistematica e energia como recurso finito.
```

---

### ❌ Copiar texto original inteiro
```markdown
## Conteudo
[Texto completo copiado do artigo original...]
```

### ✅ Correto
```markdown
## Principais Insights
1. **Insight 1** - Explicacao com minhas palavras
2. **Insight 2** - Conexao com outros conceitos
3. **Insight 3** - Aplicacao pratica
```

---

### ❌ Nota sem valor agregado
```markdown
# Video do Fulano
Assisti o video. Foi bom.
```

### ✅ Correto
```markdown
# Video do Fulano

## Contexto
Por que esse video e relevante para mim.

## Principais Pontos
1. Ponto acionavel
2. Ponto acionavel

## Aplicacao
Como vou usar isso.
```

---

## Callouts

### ❌ Callout sem tipo
```markdown
> Isso e importante
```

### ✅ Correto
```markdown
> [!warning] Atencao
> Isso e importante
```

---

### ❌ Excesso de callouts
```markdown
> [!note] Nota 1
> Texto

> [!tip] Dica
> Texto

> [!warning] Aviso
> Texto

> [!info] Info
> Texto
```

### ✅ Correto
```markdown
Texto normal com fluxo de leitura.

> [!key] Ponto Central
> O insight mais importante da nota.

Mais contexto e explicacao.
```

---

## Metadados

### ❌ Tags genericas
```yaml
tags: [nota, conteudo, interessante]
```

### ✅ Correto
```yaml
tags: [produtividade, gestao-tempo, framework]
```

---

### ❌ Propriedades da nota ausentes
```markdown
# Nota
Conteudo...
[fim abrupto]
```

### ✅ Correto
```markdown
# Nota
Conteudo...

---
## Propriedades da nota
- **Criado em:** 2024-01-15
- **Fonte:** URL ou referencia
- **Tipo:** artigo | video | livro
```

---

## Extracao de Conteudo

### ❌ WebFetch para YouTube
```
WebFetch(https://www.youtube.com/watch?v=xxx)
-> Error: Claude Code is unable to fetch from www.youtube.com
```

### ✅ Correto
```bash
python "C:\Users\Alex\.claude\skills\nota-obsidian\scripts\extrator-youtube.py" "URL"
```

---

### ❌ Abrir navegador para YouTube
```
navigate(www.youtube.com)
screenshot()
```

### ✅ Correto
```bash
python "C:\Users\Alex\.claude\skills\nota-obsidian\scripts\extrator-youtube.py" "URL"
```

---

## Salvamento

### ❌ Mostrar nota no terminal
```
Aqui esta a nota gerada:
[bloco de codigo com a nota]
Copie e cole no Obsidian.
```

### ✅ Correto
```
Write(C:\dev\obsidian-alexdonega\Atlas\Conteudos\Video Youtube\titulo-video.md)
Nota criada: C:\dev\obsidian-alexdonega\Atlas\Conteudos\Video Youtube\titulo-video.md
```

---

## Resumo dos Anti-Patterns

| Anti-Pattern | Problema | Solucao |
|:-------------|:---------|:--------|
| WebFetch YouTube | Nao funciona | Usar Python extrator |
| Navegador YouTube | Desnecessario, lento | Usar Python extrator |
| Nota no terminal | Usuario precisa copiar | Usar Write para salvar |
| ## + ``` | Renderizacao quebrada | Adicionar texto entre |
| XML na nota | Poluicao visual | Remover antes de salvar |
| Frontmatter vazio | Metadados perdidos | Preencher todos campos |
| Links genericos | Grafo inutil | Links especificos |
| Pasta errada | Organizacao quebrada | Regra de autoria |
| Resumo raso | Nota sem valor | Insights acionaveis |
| Copia integral | Sem processamento | Reescrever com valor |
| Tags genericas | Busca ineficaz | Tags especificas |
| Sem propriedades | Rastreio perdido | Sempre incluir |
