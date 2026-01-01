# Workflow: Notas Organizacionais

Pipeline para `moc`, `projeto`, `dashboard`, `checklist` e `jornada`.

---

## Tipos e Propositos

| Tipo | Proposito |
|:-----|:----------|
| `moc` | Mapa de conteudo - indice tematico |
| `projeto` | Documentacao de projeto ativo |
| `dashboard` | Visao geral com queries Dataview |
| `checklist` | Lista de verificacao reutilizavel |
| `jornada` | Registro diario/reflexao |

---

## Extracao: Input do Usuario

Notas organizacionais dependem do contexto do usuario:

```
moc: "Qual tema este mapa vai organizar?"
projeto: "Nome e objetivo do projeto?"
dashboard: "O que voce quer monitorar?"
checklist: "Para qual processo e esta checklist?"
jornada: "Data e contexto da reflexao?"
```

---

## Salvamento

| Tipo | Pasta |
|:-----|:------|
| `moc` | `Atlas/Mapas/` |
| `projeto` | `Esforcos/Projetos/` |
| `dashboard` | `Esforcos/Projetos/` |
| `checklist` | `Atlas/Conteudos/Checklists/` (terceiros) ou `Work/Conteudos Mestre/` (alex) |
| `jornada` | `Calendario/Dias/` |

### Templates

| Tipo | Template |
|:-----|:---------|
| `moc` | `template-moc.md` |
| `projeto` | `template-projeto.md` |
| `dashboard` | `template-dashboard.md` |
| `checklist` | `template-checklist.md` |
| `jornada` | `template-jornada.md` |

---

## Especificidades

### MOC (Map of Content)
- Links agrupados por subtema
- Sem conteudo proprio, apenas organizacao
- Atualizado conforme vault cresce

### Dashboard
- Usa queries Dataview
- Atualiza automaticamente
- Frontmatter com campos para filtros

### Jornada
- Nomenclatura: `YYYY-MM-DD.md`
- Pasta por ano/mes se preferir

---

## Checklist

- [ ] Proposito da nota claro?
- [ ] Template correto carregado?
- [ ] Estrutura organizacional adequada?
- [ ] Nota salva com Write?
