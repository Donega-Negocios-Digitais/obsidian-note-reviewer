# Troubleshooting - Skill nota-obsidian

Problemas comuns e como resolve-los.

---

## Problemas de Template

### Template nao encontrado
**Sintoma:** Claude nao consegue carregar o template.
**Causa:** Caminho incorreto ou arquivo movido.
**Solucao:** Verificar se o template existe em `assets/templates/`.

### Bloco XML aparece na nota final
**Sintoma:** O bloco `<gerador-nota-*>` foi incluido na nota.
**Causa:** Claude nao removeu as instrucoes.
**Solucao:** Lembrar Claude de NUNCA incluir blocos XML na nota final.

### Frontmatter incompleto
**Sintoma:** Campos vazios ou faltando no YAML.
**Causa:** Claude pulou campos opcionais.
**Solucao:** Pedir para preencher TODOS os campos do frontmatter.

---

## Problemas de Salvamento

### Nota salva na pasta errada
**Sintoma:** Conteudo de terceiros em Work/ ou vice-versa.
**Causa:** Regra de autoria ignorada.
**Solucao:** Especificar claramente se e conteudo proprio ou de terceiros.

### Caminho do vault incorreto
**Sintoma:** Arquivo nao aparece no Obsidian.
**Causa:** Caminho base errado.
**Solucao:** Confirmar que o vault esta em `C:\dev\obsidian-alexdonega`.

### Caracteres especiais no nome do arquivo
**Sintoma:** Erro ao salvar ou link quebrado.
**Causa:** Caracteres invalidos (: * ? " < > |).
**Solucao:** Usar apenas letras, numeros, espacos e hifens.

---

## Problemas de Formatacao

### Titulo seguido de bloco de codigo
**Sintoma:** Renderizacao quebrada no Obsidian.
**Causa:** Regra 7 ignorada (## seguido de ```).
**Solucao:** Sempre adicionar 1-3 frases ANTES de blocos de codigo.

### Wikilinks nao funcionam
**Sintoma:** Links aparecem como texto simples.
**Causa:** Formato incorreto ou nota destino nao existe.
**Solucao:** Usar formato `[[Nome Exato da Nota]]`.

### Callouts nao renderizam
**Sintoma:** Bloco aparece como citacao comum.
**Causa:** Sintaxe incorreta.
**Solucao:** Usar `> [!tipo]` na primeira linha.

---

## Problemas de Deteccao

### Tipo de nota errado detectado
**Sintoma:** Template incorreto aplicado.
**Causa:** Palavras-chave ambiguas no input.
**Solucao:** Usar comando especifico: `/nota [tipo] [input]`.

### URL nao reconhecida
**Sintoma:** Template generico aplicado para URL especifica.
**Causa:** Dominio nao mapeado.
**Solucao:** Forcar template: `/nota video [url]` ou `/nota artigo [url]`.

---

## Comandos de Debug

```
/nota listar          # Lista todos os templates disponiveis
/nota [tipo] [input]  # Forca um template especifico
```

## Checklist de Verificacao

- [ ] Template correto carregado?
- [ ] Frontmatter completo?
- [ ] Bloco XML removido?
- [ ] Pasta de destino correta (Atlas vs Work)?
- [ ] Wikilinks criados?
- [ ] Secao "Propriedades da nota" incluida?
