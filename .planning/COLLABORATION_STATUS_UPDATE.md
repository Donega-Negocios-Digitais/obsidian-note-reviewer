# Sistema de Colaboradores - Atualização de Status

**Data:** 2026-02-08
**Status:** ✅ **COMPLETO**

---

## Alterações Implementadas

### 1. Sistema de 3 Status para Colaboradores

| Status | Badge | Descrição | Transição |
|--------|-------|-----------|-----------|
| **Pendente** | ⏳ Amarelo | Convite enviado, aguardando aceitação | → Ativo (automático) |
| **Ativo** | ✓ Verde | Usuário aceitou o convite | ↔ Desativado (manual) |
| **Desativado** | 🚫 Cinza | Desativado manualmente pelo admin | ↔ Ativo (manual) |

### 2. API Functions

- `deactivateCollaborator(noteId, userId)` - Desativa colaborador
- `reactivateCollaborator(noteId, userId)` - Reativa colaborador
- `getDocumentCollaborators(noteId, includeInactive)` - Retorna colaboradores ativos e inativos

### 3. Interface Visual

- Badges coloridos para cada status
- Botão de power (🔌) que muda de cor:
  - Vermelho quando ativo (para desativar)
  - Verde quando inativo (para reativar)
- Texto indicativo para status pendente
- Pendente não mostra botão de ação (usuário precisa aceitar)

### 4. Arquivos Modificados

| Arquivo | Descrição |
|---------|-----------|
| `packages/ui/components/CollaborationSettings.tsx` | Componente atualizado com 3 status |
| `packages/collaboration/src/collaborators.ts` | API functions para ativar/desativar |
| `packages/collaboration/src/index.ts` | Export das novas funções |
| `packages/ui/locales/pt-BR.json` | Traduções PT-BR |
| `packages/ui/locales/en-US.json` | Traduções EN-US |

### 5. Traduções Adicionadas

```json
"active": "Ativo",
"inactive": "Desativado",
"activate": "Ativar",
"deactivate": "Desativar",
"statusPending": "Pendente",
"statusActive": "Ativo",
"statusInactive": "Desativado"
```

---

## Como Usar

### Ativar/Desativar Colaborador

```tsx
import { deactivateCollaborator, reactivateCollaborator } from '@repo/collaboration';

// Desativar
await deactivateCollaborator(noteId, userId);

// Reativar
await reactivateCollaborator(noteId, userId);
```

### Listar Colaboradores (Incluindo Inativos)

```tsx
import { getDocumentCollaborators } from '@repo/collaboration';

const collaborators = await getDocumentCollaborators(noteId, true);
// Retorna: ativos + inativos (exclui 'removed')
```

---

## Comportamento dos Status

### Fluxo de Convite

```
[Email enviado] → PENDENTE → [Usuário aceita] → ATIVO
                                           ↘ [Admin desativa] → DESATIVADO
                                                              ↘ [Admin reativa] → ATIVO
```

### Permissões por Status

| Status | Pode anotar? | Pode ver? | Pode ser reativado? |
|--------|--------------|-----------|---------------------|
| Pendente | ❌ | ❌ | N/A |
| Ativo | ✅ | ✅ | N/A |
| Desativado | ❌ | ❌ | ✅ |

---

**Tipo de Status:** `CollaboratorStatus = 'active' | 'pending' | 'inactive'`
