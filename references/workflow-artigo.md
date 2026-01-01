# Workflow - Artigo Web

## Quando usar
- URLs que não são YouTube, GitHub ou Substack
- Artigos de blog, tutoriais, documentação

---

## Estratégia de Extração

**Usar WebFetch** para extrair conteúdo:

```
WebFetch(url, prompt="Extrair título, autor, data, e conteúdo principal")
```

### Informações a extrair:
- Título do artigo
- Autor
- Data de publicação
- URL original
- Conteúdo principal (resumo ou pontos-chave)

---

## Template

**Terceiros**: `template-artigo.md`
**Alex**: `template-artigo-alex.md`

---

## Pasta de Destino

- **Terceiros**: `Atlas/Conteudos/Artigos/`
- **Alex**: `Work/Artigos/`

---

## Exemplo de Fluxo

```
1. Usuário: "criar nota do artigo https://exemplo.com/post"
2. DETECT: tipo = artigo, autoria = terceiros
3. EXTRACT: WebFetch(url)
4. SAVE:
   - Carregar template-artigo.md
   - Preencher com dados extraídos
   - Salvar em Atlas/Conteudos/Artigos/titulo-do-artigo.md
   - Retornar link obsidian://
```

---

## Dicas

- Para artigos longos, focar em pontos-chave
- Preservar estrutura de headings
- Incluir citações importantes
- Adicionar tags relevantes no frontmatter
