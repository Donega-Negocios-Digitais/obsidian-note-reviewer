# Workflow: Conteudo Educacional

Pipeline para `livro`, `curso` e `aula`.

---

## Extracao: Input do Usuario

Conteudo educacional geralmente nao tem URL unica. Solicitar:

| Tipo | Dados Necessarios |
|:-----|:------------------|
| `livro` | Titulo, autor, capitulos/secoes relevantes |
| `curso` | Nome, instrutor, modulos, plataforma |
| `aula` | Titulo, fonte, topicos abordados |

### Prompt para Usuario

```
Para criar a nota de [tipo], preciso de:
- Titulo completo
- Autor/Instrutor
- Principais topicos ou capitulos
- Insights ou citacoes importantes
```

---

## Salvamento

| Tipo | Pasta | Template |
|:-----|:------|:---------|
| `livro` | `Atlas/Conteudos/Livros/` | `template-livro.md` |
| `curso` | `Atlas/Conteudos/Cursos/` | `template-curso.md` |
| `aula` | `Atlas/Conteudos/Aulas/` | `template-aula.md` |

**Nota:** Tipos educacionais sao sempre `autoria: terceiros`.

---

## Estrutura Tipica

### Livro
- Frontmatter com metadados bibliograficos
- Resumo por capitulo
- Citacoes marcantes
- Conexoes com outras notas

### Curso
- Visao geral do curso
- Modulos/aulas listados
- Principais aprendizados
- Projetos praticos

### Aula
- Contexto (parte de qual curso/serie)
- Topicos abordados
- Anotacoes
- Proximos passos

---

## Checklist

- [ ] Dados coletados do usuario?
- [ ] Template correto selecionado?
- [ ] Frontmatter preenchido?
- [ ] Nota salva com Write?
