# Configuração do Obsidian Note Reviewer

Este é o obsidian-note-reviewer adaptado para revisar notas do Obsidian em português.

## Alterações Implementadas

✅ **Interface traduzida para pt-BR**
- Todos os textos da interface em português
- Botões, labels e mensagens localizados

✅ **Caixa de sugestões aumentada**
- Input de comentários expandido de 176px para 320px
- Mais espaço para feedback detalhado

✅ **Mascotes Tater removidos**
- Interface mais limpa e profissional
- Sem animações desnecessárias

✅ **Suporte a frontmatter YAML**
- Parser detecta e preserva frontmatter no início das notas
- Frontmatter renderizado em bloco separado

✅ **Endpoint de save no vault**
- API `/api/save` para salvar notas no vault do Obsidian
- Cria diretórios automaticamente se necessário
- **Proteção contra path traversal (CWE-22)** - valida caminhos para prevenir escrita em locais não autorizados
- Suporte a `ALLOWED_SAVE_PATHS` para restringir saves a diretórios específicos (defense-in-depth)

## Instalação

### 1. Build do projeto

```bash
cd C:/dev/obsidian-note-reviewer
bun install
bun run build
```

### 2. Configurar hook no Claude Code

Adicione ao seu `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "C:/dev/obsidian-note-reviewer/apps/hook/dist/plannotator",
            "timeout": 1800
          }
        ]
      }
    ]
  }
}
```

**Nota:** Ajuste o caminho conforme necessário.

### 3. Reiniciar Claude Code

Após adicionar o hook, reinicie o Claude Code para que as alterações tenham efeito.

## Uso

1. No Claude Code, quando estiver planejando uma nota, use `/plan` ou `EnterPlanMode`
2. Quando terminar o plano, use `ExitPlanMode`
3. O obsidian-note-reviewer abrirá automaticamente no navegador
4. Revise a nota, adicione anotações
5. Aprove ou solicite alterações

## API de Save

Para salvar uma nota no vault, faça uma requisição POST para `/api/save`:

```javascript
fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'C:/caminho/para/vault/nome-da-nota.md',
    content: '# Título\n\nConteúdo da nota...'
  })
})
```

### Respostas da API

**Sucesso (200):**
```json
{
  "ok": true,
  "message": "Nota salva com sucesso",
  "path": "C:/caminho/normalizado/para/nota.md"
}
```

**Erro de validação (400):**
```json
{
  "ok": false,
  "error": "Mensagem de erro descritiva"
}
```

**Erro interno (500):**
```json
{
  "ok": false,
  "error": "Erro ao salvar nota"
}
```

### Validação de Segurança

O endpoint `/api/save` inclui proteção contra ataques de **path traversal** (CWE-22). Caminhos maliciosos que tentam acessar diretórios fora do permitido são rejeitados automaticamente.

**Vetores de ataque bloqueados:**
- Travessia simples: `../`, `..\\`
- Separadores mistos: `../..\\`
- URL encoding: `%2e%2e%2f`, `%2e%2e/`
- Double encoding: `%252e%252e%252f`
- Unicode overlong: `%c0%ae%c0%ae/`
- Null byte injection: `file.txt%00.jpg`

### Restrição de Diretórios (Defense-in-Depth)

Para maior segurança, você pode restringir os saves a diretórios específicos usando a variável de ambiente `ALLOWED_SAVE_PATHS`:

```bash
# Único vault
export ALLOWED_SAVE_PATHS="C:/Users/seu-usuario/Obsidian/MeuVault"

# Múltiplos vaults (separados por vírgula)
export ALLOWED_SAVE_PATHS="C:/Vault1,C:/Vault2,D:/Obsidian/Notas"
```

**Comportamento:**
- Se `ALLOWED_SAVE_PATHS` está configurado: saves são restritos aos diretórios listados
- Se não configurado: o servidor emite um aviso no log, mas permite saves em qualquer caminho (desde que passe na validação de path traversal)

**Exemplo de configuração no Windows:**
```powershell
# PowerShell - definir antes de executar o hook
$env:ALLOWED_SAVE_PATHS = "C:\Users\$env:USERNAME\Obsidian\MeuVault"
```

**Exemplo de configuração no Linux/macOS:**
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export ALLOWED_SAVE_PATHS="/home/$USER/Obsidian/Vault"
```

## Frontmatter YAML

O parser agora detecta e preserva frontmatter YAML no início das notas:

```yaml
---
title: Minha Nota
tags: [obsidian, anotações]
date: 2025-01-01
---

# Conteúdo da nota

Texto aqui...
```

O frontmatter será renderizado em um bloco separado e preservado ao exportar.

## Considerações de Segurança

### Path Traversal (CWE-22)

O endpoint `/api/save` valida todos os caminhos de arquivo para prevenir ataques de path traversal. Isso impede que um atacante salve arquivos em locais não autorizados do sistema.

**Recomendações:**
1. **Sempre configure `ALLOWED_SAVE_PATHS`** para restringir saves ao seu vault Obsidian
2. O servidor roda localmente (localhost) por padrão, reduzindo a superfície de ataque
3. Logs de segurança são prefixados com `[SECURITY]` para fácil monitoramento

### Mensagens de Erro

As mensagens de erro são projetadas para serem informativas sem expor informações sensíveis do sistema:
- Erros de path traversal indicam "Path traversal detected" sem revelar o caminho tentado
- Erros de diretório não permitido indicam "Path is not within any allowed directory" sem listar os diretórios permitidos

### Logs de Segurança

O servidor registra eventos de segurança no stderr:

```
[Server] [SECURITY] Allowed save paths configured: C:/Vault1, C:/Vault2
[Server] [SECURITY] Path validation failed for path: Path traversal detected
```

## Suporte

Para problemas ou sugestões, abra uma issue no repositório original:
https://github.com/backnotprop/plannotator/issues
