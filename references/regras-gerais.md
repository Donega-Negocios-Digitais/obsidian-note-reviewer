# Regras Gerais - Criação de Notas Obsidian

## Pipeline de Criação

```
DETECT → EXTRACT → SAVE
```

**SEMPRE seguir este fluxo em ordem.**

---

## 1. DETECT - Identificar tipo de nota

### Por URL
- `youtube.com`, `youtu.be` → **video_youtube**
- `substack.com` → **newsletter**
- `github.com` → **github**
- Outras URLs → **artigo**

### Por Palavra-Chave
- "livro", "book" → **livro**
- "curso", "módulo" → **curso**
- "aula", "lição" → **aula**
- "conceito", "o que é" → **atomica**
- "framework", "método" → **framework**
- "pessoa", "quem é" → **pessoa**
- "moc", "mapa" → **moc**
- "projeto" → **projeto**

### Autoria
- Palavras "meu", "minha", "próprio" → **alex** (pasta: `Work/`)
- Default → **terceiros** (pasta: `Atlas/`)

---

## 2. EXTRACT - Extrair informações

- **YouTube**: Usar script Python (extrator-youtube.py)
- **Web**: Usar WebFetch
- **Educacional**: Input do usuário
- **Conceito**: Input + pesquisa

---

## 3. SAVE - Salvar no vault

1. **Carregar template** do vault:
   - Terceiros: `C:\dev\obsidian-alexdonega\Sistema\Templates\Templates de notas conteúdo\template-{tipo}.md`
   - Alex: `C:\dev\obsidian-alexdonega\Sistema\Templates\Templates de notas work\template-{tipo}-alex.md`

2. **Seguir instruções** do template

3. **Salvar com Write**:
   ```
   C:\dev\obsidian-alexdonega\{pasta_base}\{subpasta}\{nome-arquivo}.md
   ```

4. **Confirmar com link clicável**:
   ```
   ✅ Nota salva: [Abrir no Obsidian](obsidian://open?vault=obsidian-alexdonega&file={path_relativo_url_encoded})
   ```

---

## Vault Configuration

- **Vault name**: `obsidian-alexdonega`
- **Vault path**: `C:\dev\obsidian-alexdonega`
- **Templates path**: `C:\dev\obsidian-alexdonega\Sistema\Templates`

---

## REGRAS ABSOLUTAS

1. ✅ **SEMPRE** executar DETECT → EXTRACT → SAVE
2. ✅ **SEMPRE** usar Python para YouTube (NUNCA WebFetch)
3. ✅ **SEMPRE** salvar com Write no vault
4. ✅ **SEMPRE** entregar link clicável `obsidian://` no final
5. ❌ **NUNCA** mostrar nota no terminal para copiar
6. ❌ **NUNCA** abrir navegador para YouTube
