# Workflow: Notas Conceituais

Pipeline para `atomica`, `framework` e `pessoa`.

---

## Extracao: Input + Pesquisa

| Tipo | Fonte Principal | Complemento |
|:-----|:----------------|:------------|
| `atomica` | Input do usuario | WebSearch se necessario |
| `framework` | Input do usuario | Documentacao oficial |
| `pessoa` | Input do usuario | Wikipedia, LinkedIn |

### Prompt para Usuario

```
atomica: "O que voce quer documentar sobre [conceito]?"
framework: "Descreva os componentes do framework [nome]"
pessoa: "Quem e [nome]? Contexto relevante?"
```

---

## Salvamento

| Tipo | Terceiros | Alex |
|:-----|:----------|:-----|
| `atomica` | `Atlas/Atomos/Conceitos/` | N/A |
| `framework` | `Atlas/Conteudos/Frameworks/` | `Work/DNAs/` |
| `pessoa` | `Atlas/Atomos/Pessoas/` | N/A |

### Templates

| Tipo | Template |
|:-----|:---------|
| `atomica` | `template-atomica.md` |
| `framework` | `template-framework.md` |
| `pessoa` | `template-pessoa.md` |

---

## Principios de Notas Atomicas

1. **Uma ideia por nota** - conceito unico e coeso
2. **Autocontida** - compreensivel sem contexto externo
3. **Conectavel** - links para notas relacionadas
4. **Evergreen** - escrita para o futuro

---

## Checklist

- [ ] Conceito bem definido?
- [ ] Nota e atomica (uma ideia)?
- [ ] Links para notas relacionadas?
- [ ] Nota salva com Write?
