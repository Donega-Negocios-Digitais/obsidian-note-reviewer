# Integração com Obsidian via MCP

## Pré-requisitos
- Claude Code instalado
- Vault Obsidian existente
- Comando `obsreview` instalado
- Para uso via portal web: login é obrigatório no app

## Comandos de Hooks (Obsreview)

Use estes comandos na configuração de hooks do Claude Code:

- `obsreview plan-live` para `PostToolUse` + `Write` em `/.claude/plans/` (fluxo principal)
- `obsreview obsidian` para `PostToolUse` + `Write` em planos do vault (`Plans/`, `.obsidian/plans/`, `plan/`)
- `obsreview plan` para `PermissionRequest` + `ExitPlanMode` (fallback)
- `obsreview nota <arquivo.md>` (ou `obsreview annotate <arquivo.md>`) para anotar markdown manualmente

### Configuração moderna (matcher/hooks)

Use o padrão moderno do Claude Code (`hooks.matcher/hooks`) em vez de `when/then`.

### Legado (when/then)

Se você ainda encontrar exemplos antigos:
- `when: ExitPlanMode` mapeia para `PermissionRequest.matcher: "ExitPlanMode"`
- `when: Write` mapeia para `PostToolUse.matcher: "Write"`
- `then.command` mapeia para `hooks[].hooks[].command`

## Configuração

### 1. Instalar Servidor MCP Obsidian
```bash
npm install -g @anthropic/obsidian-mcp-server
```

### 2. Configurar Claude Desktop
Editar `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "obsidian-mcp-server",
      "args": ["--vault", "C:/caminho/para/vault"],
      "env": {}
    }
  }
}
```

### 3. Reiniciar Claude Code
```bash
claude-code restart
```

## Recursos Disponíveis

### Ler Nota
```typescript
await mcp.callTool('obsidian.read_note', { path: 'notas/exemplo.md' });
```

### Escrever Nota
```typescript
await mcp.callTool('obsidian.write_note', {
  path: 'notas/exemplo.md',
  content: '# Título\n\nConteúdo...'
});
```

### Listar Notas
```typescript
await mcp.callTool('obsidian.list_notes', { folder: 'notas/' });
```

## Limitações Atuais
- Servidor MCP customizado ainda não implementado
- Usar endpoint `/api/save` local como alternativa temporária

## Uso Atual: Endpoint Local `/api/save`

Enquanto o servidor MCP não está implementado, o Obsidian Note Reviewer usa um endpoint local para salvar notas:

### Endpoint
```
POST /api/save
```

### Payload
```json
{
  "content": "# Título\n\nConteúdo da nota...",
  "path": "C:/caminho/completo/para/nota.md"
}
```

### Resposta de Sucesso
```json
{
  "ok": true,
  "message": "Nota salva com sucesso"
}
```

### Resposta de Erro
```json
{
  "ok": false,
  "error": "Mensagem de erro"
}
```

### Configuração no App

1. Abra as configurações (ícone de engrenagem)
2. Configure o "Caminho do Vault" (ex: `C:/Users/Nome/Documents/ObsidianVault`)
3. Configure o "Caminho da Nota" (ex: `notas/minha-nota.md`)
4. O botão "Salvar no Vault" será habilitado
5. Clique para salvar a nota diretamente no vault

### Características

- **Criação automática de diretórios**: O endpoint cria diretórios recursivamente se não existirem
- **Encoding UTF-8**: Preserva corretamente acentos e caracteres especiais do português
- **Validação de caminho**: Bloqueia path traversal (CWE-22)
- **Restrição opcional por vault**: `ALLOWED_SAVE_PATHS` limita onde escrita em disco é permitida

### Validação de persistência real (vault)

Fluxo recomendado para confirmar salvamento no Obsidian:

1. No app, configurar `Caminho do Vault` e `Caminho da Nota`.
2. Clicar em **Salvar no Obsidian**.
3. Verificar em disco que o arquivo foi criado/atualizado.
4. Abrir a nota no Obsidian e confirmar o conteúdo.

Se qualquer etapa falhar, o erro deve ser exibido na UI sem bloquear outros destinos de salvamento (app/Claude).

## Modelo Context Protocol (MCP)

O MCP é o padrão moderno da Anthropic para conectar LLMs a ferramentas externas.

### Vantagens do MCP

- **Protocolo oficial da Anthropic**: Suportado nativamente pelo Claude Code
- **Integração bidirecional**: Permite tanto leitura quanto escrita
- **Mais seguro**: Não expõe endpoints HTTP publicamente
- **Suporte a operações complexas**: Busca, listagem, modificação em lote

### Implementação Futura

Para implementar um servidor MCP customizado para Obsidian:

1. **Criar servidor MCP**
   ```typescript
   import { Server } from '@anthropic/mcp-server';

   const server = new Server({
     name: 'obsidian',
     version: '1.0.0'
   });
   ```

2. **Implementar handlers**
   - `obsidian.read_note(path)` - Ler nota
   - `obsidian.write_note(path, content)` - Escrever nota
   - `obsidian.list_notes(folder)` - Listar notas
   - `obsidian.search(query)` - Buscar por conteúdo
   - `obsidian.update_frontmatter(path, frontmatter)` - Atualizar frontmatter

3. **Publicar como pacote npm**
   ```bash
   npm publish @your-org/obsidian-mcp-server
   ```

### Referências

- [Model Context Protocol - Introdução](https://modelcontextprotocol.io/introduction)
- [MCP SDK - Documentação](https://github.com/anthropics/mcp-sdk)
- [Claude Code - MCP Integration](https://docs.claude.ai/claude-code/mcp)

## Solução de Problemas

### Erro: "Configure o caminho do arquivo nas configurações"
- Verifique se você configurou tanto o "Caminho do Vault" quanto o "Caminho da Nota" nas configurações

### Erro ao salvar: "Erro ao salvar"
- Verifique se o caminho do vault existe e tem permissões de escrita
- Certifique-se de que o caminho da nota inclui a extensão `.md`
- No Windows, use barras `/` em vez de `\` nos caminhos

### Obsidian não detecta mudanças
- Feche e reabra a nota no Obsidian
- Ou use Ctrl+R (Cmd+R no Mac) para recarregar o arquivo
- Obsidian detecta mudanças externas automaticamente em alguns segundos

### Caracteres especiais aparecem corrompidos
- Este problema foi corrigido. O endpoint `/api/save` agora usa UTF-8 explicitamente
- Se ainda ocorrer, verifique se o arquivo foi salvo com encoding UTF-8
