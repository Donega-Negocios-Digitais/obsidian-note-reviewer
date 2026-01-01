# Workflow: Conteudo Web

Pipeline para `artigo`, `newsletter` e `github`.

---

## Extracao: WebFetch

```
WebFetch(url, prompt="Extrair titulo, autor, data e conteudo principal")
```

### Por Tipo

| Tipo | Dominio Tipico | Foco da Extracao |
|:-----|:---------------|:-----------------|
| `artigo` | Qualquer | Titulo, autor, conteudo |
| `newsletter` | substack.com | Titulo, autor, edicao, conteudo |
| `github` | github.com | Nome repo, descricao, README |

### Se WebFetch Falhar

1. Informar erro ao usuario
2. Pedir que cole o conteudo manualmente
3. Prosseguir com SAVE

---

## Salvamento

| Tipo | Terceiros | Alex |
|:-----|:----------|:-----|
| `artigo` | `Atlas/Conteudos/Artigos/` | `Work/Conteudos Mestre/` |
| `newsletter` | `Atlas/Conteudos/Newsletters/` | `Work/Newsletters/` |
| `github` | `Atlas/Conteudos/GitHub/` | N/A |

### Templates

| Tipo | Template |
|:-----|:---------|
| `artigo` | `template-artigo.md` |
| `newsletter` | `template-newsletter.md` |
| `github` | `template-github.md` |

---

## Checklist

- [ ] URL identificada?
- [ ] WebFetch executado?
- [ ] Conteudo extraido ou obtido do usuario?
- [ ] Nota salva com Write?
