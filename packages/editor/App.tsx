/* eslint-disable @typescript-eslint/no-unused-vars, no-console, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '@obsidian-note-reviewer/ui/i18n/config'; // Initialize i18n
import obsreviewLogo from '@obsidian-note-reviewer/ui/obsreview.webp';
import { parseMarkdownToBlocks, exportDiff } from '@obsidian-note-reviewer/ui/utils/parser';
import { Viewer, ViewerHandle } from '@obsidian-note-reviewer/ui/components/Viewer';
import { ViewerSkeleton } from '@obsidian-note-reviewer/ui/components/ViewerSkeleton';
import { AnnotationPanel } from '@obsidian-note-reviewer/ui/components/AnnotationPanel';
import { ExportModal } from '@obsidian-note-reviewer/ui/components/ExportModal';
import { GlobalCommentInput } from '@obsidian-note-reviewer/ui/components/GlobalCommentInput';
import { Annotation, Block, EditorMode, AnnotationType } from '@obsidian-note-reviewer/ui/types';
import { ThemeProvider, useTheme } from '@obsidian-note-reviewer/ui/components/ThemeProvider';
import { ModeToggle } from '@obsidian-note-reviewer/ui/components/ModeToggle';
import { ModeSwitcher } from '@obsidian-note-reviewer/ui/components/ModeSwitcher';
import { SettingsPanel } from '@obsidian-note-reviewer/ui/components/SettingsPanel';
import { KeyboardShortcutsModal } from '@obsidian-note-reviewer/ui/components/KeyboardShortcutsModal';
import { HowItWorksModal } from '@obsidian-note-reviewer/ui/components/HowItWorksModal';
import { BaseModal } from '@obsidian-note-reviewer/ui/components/BaseModal';
import { useSharing } from '@obsidian-note-reviewer/ui/hooks/useSharing';
import { acceptInvite, getCurrentUserRole, useDocumentPresence } from '@obsidian-note-reviewer/collaboration';
import {
  storage,
  getVaultPath,
  getNotePath,
  setVaultPath,
  setNotePath,
  getNoteType,
  saveAnnotations,
  loadAnnotations,
  clearAnnotations
} from '@obsidian-note-reviewer/ui/utils/storage';
import { updateDisplayName } from '@obsidian-note-reviewer/ui/utils/identity';
import { isInputFocused, formatTooltipWithShortcut } from '@obsidian-note-reviewer/ui/utils/shortcuts';
import { type TipoNota } from '@obsidian-note-reviewer/ui/utils/notePaths';
import {
  normalizeNoteSourcePath,
  tryLoadCloudState,
  trySyncCloudAnnotations,
} from './cloudPersistence';
import {
  listAccessibleDocuments,
  createDocument,
  openDocument,
  renameDocument,
  ensurePublicShareLink,
  softDeleteDocument,
  restoreDocument,
  permanentDeleteDocument,
  listTrashDocuments,
  purgeExpiredDocuments,
  resolveCurrentWorkspaceProfile,
  type DocumentRecord,
  type TrashDocumentRecord,
} from './documentService';
import { RaycastDocumentsModal } from './components/RaycastDocumentsModal';
import { TrashDocumentsModal } from './components/TrashDocumentsModal';

const PLAN_CONTENT = `---
title: Nota de Exemplo - Teste Completo
description: Nota com imagens, código, links e vídeos para testar o Obsidian Note Reviewer
date: 2026-02-07
tags: [teste, exemplo, obsidian, desenvolvimento, plugin, markdown, typescript, react, review]
category: Documentação
author: Alex
status: draft
priority: alta
version: 1.0.0
---

# 📝 Nota de Exemplo - Teste Completo

> Esta nota foi criada para testar todas as funcionalidades do **Obsidian Note Reviewer**

---

## 📷 Imagens de Teste

### Imagem 1: Natureza/Paisagem
![Paisagem Montanha](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)
*Fonte: Unsplash - Montanhas ao pôr do sol*

### Imagem 2: Tecnologia/Código
![Código em Tela](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80)
*Fonte: Unsplash - Tela com código*

---

## 💻 Blocos de Código

### JavaScript/TypeScript
\`\`\`typescript
// Interface para anotações
interface Annotation {
  id: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

// Função para filtrar anotações
const filterAnnotations = (
  annotations: Annotation[],
  searchTerm: string
): Annotation[] => {
  return annotations.filter(anno => 
    anno.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anno.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

export { filterAnnotations };
export type { Annotation };
\`\`\`

### Python
\`\`\`python
import json
from datetime import datetime
from typing import List, Dict, Optional

class NoteReviewer:
    """Classe principal para revisão de notas do Obsidian."""
    
    def __init__(self, vault_path: str):
        self.vault_path = vault_path
        self.notes: List[Dict] = []
    
    def load_notes(self) -> None:
        """Carrega todas as notas do vault."""
        import os
        for root, _, files in os.walk(self.vault_path):
            for file in files:
                if file.endswith('.md'):
                    self.notes.append({
                        'path': os.path.join(root, file),
                        'name': file
                    })
    
    def export_to_json(self, output_path: str) -> bool:
        """Exporta as notas para formato JSON."""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.notes, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Erro ao exportar: {e}")
            return False

# Uso
if __name__ == "__main__":
    reviewer = NoteReviewer("/path/to/vault")
    reviewer.load_notes()
    reviewer.export_to_json("notes_export.json")
\`\`\`

### CSS/SCSS
\`\`\`scss
// Variáveis
$primary-color: #7c3aed;
$secondary-color: #a78bfa;
$background-dark: #1a1a2e;
$text-light: #e2e8f0;

// Mixins
@mixin card-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

// Componente de anotação
.annotation-card {
  background: linear-gradient(135deg, $background-dark 0%, #16213e 100%);
  border-radius: 12px;
  padding: 1.5rem;
  @include card-shadow;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.2);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h3 {
      color: $text-light;
      font-size: 1.125rem;
      margin: 0;
    }
  }
  
  &__content {
    color: rgba($text-light, 0.8);
    line-height: 1.6;
  }
}
\`\`\`

### Bash/Shell
\`\`\`bash
#!/bin/bash

# Script para backup do vault do Obsidian
VAULT_PATH="$HOME/Documents/Obsidian Vault"
BACKUP_DIR="$HOME/Backups/Obsidian"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="obsidian_backup_$DATE.tar.gz"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Criar backup compactado
echo "📦 Criando backup..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$(dirname "$VAULT_PATH")" "$(basename "$VAULT_PATH")"

# Manter apenas os últimos 10 backups
echo "🧹 Limpando backups antigos..."
cd "$BACKUP_DIR" || exit
ls -t *.tar.gz | tail -n +11 | xargs -r rm --

echo "✅ Backup concluído: $BACKUP_FILE"
\`\`\`

### SQL
\`\`\`sql
-- Criar tabela de anotações
CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE
);

-- Índices para performance
CREATE INDEX idx_annotations_note_path ON annotations(note_path);
CREATE INDEX idx_annotations_created_at ON annotations(created_at DESC);
CREATE INDEX idx_annotations_tags ON annotations USING GIN(tags);

-- View para estatísticas
CREATE VIEW annotation_stats AS
SELECT 
    COUNT(*) as total_annotations,
    COUNT(DISTINCT note_path) as total_notes,
    AVG(LENGTH(content)) as avg_content_length,
    COUNT(*) FILTER (WHERE is_favorite = true) as favorite_count
FROM annotations;
\`\`\`

### JSON
\`\`\`json
{
  "plugin": "obsidian-note-reviewer",
  "version": "1.0.0",
  "settings": {
    "theme": "dark",
    "language": "pt-BR",
    "shortcuts": {
      "save": "Ctrl+S",
      "export": "Ctrl+E",
      "search": "Ctrl+F",
      "close": "Escape"
    },
    "export": {
      "format": "json",
      "includeMetadata": true,
      "dateFormat": "YYYY-MM-DD HH:mm:ss"
    }
  },
  "annotations": [
    {
      "id": "anno-001",
      "content": "Exemplo de anotação",
      "tags": ["importante", "review"],
      "createdAt": "2026-02-07T19:30:00Z"
    }
  ]
}
\`\`\`

---

## 🔗 Links Externos

### Documentação e Recursos
- [Obsidian](https://obsidian.md/) - O aplicativo de notas que conecta tudo
- [React Documentation](https://react.dev/) - Documentação oficial do React
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Guia completo de TypeScript
- [MDN Web Docs](https://developer.mozilla.org/) - Recursos para desenvolvedores web
- [Supabase](https://supabase.com/) - Backend as a Service open source

### Ferramentas Úteis
- [Unsplash](https://unsplash.com/) - Imagens gratuitas de alta qualidade
- [Lucide Icons](https://lucide.dev/) - Ícones bonitos e consistentes
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário

---

## 📺 Vídeos do YouTube

### Tutorial de Obsidian
[![Obsidian Tutorial](https://img.youtube.com/vi/QUVwrlSNlM4/0.jpg)](https://www.youtube.com/watch?v=QUVwrlSNlM4)

**Link direto:** [Obsidian Tutorial para Iniciantes](https://www.youtube.com/watch?v=QUVwrlSNlM4)

### React e TypeScript
[![React TypeScript](https://img.youtube.com/vi/FJDVKeh7RJI/0.jpg)](https://www.youtube.com/watch?v=FJDVKeh7RJI)

**Link direto:** [React + TypeScript - Curso Completo](https://www.youtube.com/watch?v=FJDVKeh7RJI)

---

## 📋 Checklist de Teste

- [x] Imagens renderizadas corretamente
- [x] Blocos de código com syntax highlighting
- [x] Links externos clicáveis
- [x] Links do YouTube com preview
- [x] Formatação Markdown completa
- [x] Emojis 🎉 funcionando
- [x] Tabelas formatadas

---

## 📊 Tabela de Exemplo

| Recurso | Status | Prioridade |
|---------|--------|------------|
| Syntax Highlighting | ✅ Implementado | Alta |
| Export JSON | ✅ Implementado | Alta |
| Filtros de Busca | ✅ Implementado | Média |
| Temas Customizáveis | 🚧 Em desenvolvimento | Média |
| Integração Mobile | 📋 Planejado | Baixa |

---

## 🎬 Vídeos Embedados

### Tutorial Completo de Obsidian

<iframe width="560" height="315" src="https://www.youtube.com/embed/QUVwrlSNlM4" title="Obsidian Tutorial" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Vídeo Adicional

<iframe width="560" height="315" src="https://www.youtube.com/embed/MQNRKX8GwPo?si=Osa-4Bq9SjwEIwBI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## 📝 Notas e Citações

> "A simplicidade é o último grau de sofisticação." — Leonardo da Vinci

### Callouts Diversos

#### Callouts Abertos (Não Colapsáveis)

> [!info] Informação
> Esta é uma nota de exemplo criada para testar todas as funcionalidades do Obsidian Note Reviewer. Use-a como referência para entender o que é possível fazer.

> [!success] Sucesso!
> Suas alterações foram salvas com sucesso no vault do Obsidian.

#### Callouts Colapsáveis - Começando ABERTOS (+)

> [!tip]+ Dica do Plugin (Clique para fechar)
> Use atalhos de teclado para navegar mais rapidamente entre as anotações!
> - **Ctrl+S**: Salvar
> - **Ctrl+E**: Exportar
> - **?**: Abrir configurações

> [!example]+ Exemplo Prático (Clique para fechar)
> Aqui está um exemplo de como usar a ferramenta:
> 1. Selecione um texto
> 2. Adicione sua anotação
> 3. Exporte quando terminar
> 
> Você pode adicionar múltiplas linhas e até mesmo código:
> \`\`\`javascript
> const exemplo = "Hello World";
> console.log(exemplo);
> \`\`\`

> [!todo]+ Tarefas Pendentes (Clique para fechar)
> - [ ] Implementar filtro de anotações
> - [ ] Adicionar exportação para PDF
> - [ ] Melhorar performance com notas grandes
> - [x] Adicionar callouts colapsáveis ✅

#### Callouts Colapsáveis - Começando FECHADOS (-)

> [!warning]- Atenção (Clique para abrir)
> Sempre faça backup do seu vault antes de realizar operações em massa.
> 
> Recomendamos usar o script de backup automático disponível na documentação.

> [!danger]- Cuidado! (Clique para abrir)
> Esta ação não pode ser desfeita. Tem certeza de que deseja continuar?
> 
> **Efeitos colaterais podem incluir:**
> - Perda de dados
> - Sobrescrita de arquivos
> - Inconsistências no vault

> [!bug]- Bug Conhecido (Clique para abrir)
> Em alguns casos, o syntax highlighting pode não funcionar corretamente com arquivos muito grandes.
> 
> **Workaround:** Divida a nota em partes menores ou use a visualização em modo texto.

> [!fail]- Falha (Clique para abrir)
> Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
> 
> Código do erro: ECONNREFUSED
> 
> Se o problema persistir, contate o suporte técnico.

#### Mais Callouts

> [!quote] Citação Importante
> "O conhecimento é poder." — Francis Bacon

> [!abstract] Resumo
> Esta seção contém um resumo rápido dos principais recursos disponíveis no plugin.

> [!question] Dúvida
> Como posso sincronizar minhas anotações entre diferentes dispositivos?

> [!important] Importante
> Não se esqueça de configurar o caminho do seu vault nas configurações antes de salvar.

---

*Última atualização: 07/02/2026 às 19:35*
`;
type SettingsTab =
  | 'caminhos'
  | 'regras'
  | 'idioma'
  | 'atalhos'
  | 'hooks'
  | 'perfil'
  | 'colaboracao'
  | 'integracoes';

const LEGACY_SETTINGS_PANEL_OPEN_KEY = 'obsidian-reviewer-settings-open';
const SETTINGS_PANEL_TAB_KEY = 'obsidian-reviewer-settings-tab';
const APP_MODAL_KEYS = {
  showExport: 'obsidian-reviewer-modal-showExport',
  showFeedbackPrompt: 'obsidian-reviewer-modal-showFeedbackPrompt',
  showGlobalCommentModal: 'obsidian-reviewer-modal-showGlobalCommentModal',
  showHelpVideo: 'obsidian-reviewer-modal-showHelpVideo',
  showShortcutsModal: 'obsidian-reviewer-modal-showShortcutsModal',
} as const;
const VALID_SETTINGS_TABS: SettingsTab[] = [
  'caminhos',
  'regras',
  'idioma',
  'atalhos',
  'hooks',
  'perfil',
  'colaboracao',
  'integracoes',
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && VALID_SETTINGS_TABS.includes(value as SettingsTab);
}

interface EditorUiState {
  isPanelOpen: boolean;
  isSettingsPanelOpen: boolean;
  settingsTab: SettingsTab;
  selectedAnnotationId: string | null;
}

const EDITOR_UI_STATE_KEY = 'obsidian-reviewer-editor-ui-state';

function readEditorUiState(): Partial<EditorUiState> {
  try {
    const raw = window.localStorage.getItem(EDITOR_UI_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<EditorUiState>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeEditorUiState(state: EditorUiState): void {
  try {
    window.localStorage.setItem(EDITOR_UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore persistence errors
  }
}

function readLocalFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeLocalFlag(key: string, value: boolean): void {
  try {
    if (value) {
      window.localStorage.setItem(key, '1');
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore persistence errors
  }
}

interface LivePresenceOverlayProps {
  documentId: string;
  enabled: boolean;
  containerRef: React.RefObject<HTMLElement>;
  onPresenceCountChange?: (count: number) => void;
}

function LivePresenceOverlay({
  documentId,
  enabled,
  containerRef,
  onPresenceCountChange,
}: LivePresenceOverlayProps): React.ReactElement | null {
  const { presence, updateCursor, clearCursor } = useDocumentPresence(enabled ? documentId : '');

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      updateCursor(x, y);
    };

    const handleMouseLeave = () => clearCursor();

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      clearCursor();
    };
  }, [containerRef, enabled, updateCursor, clearCursor]);

  useEffect(() => {
    onPresenceCountChange?.(presence.users.length);
  }, [presence.users.length, onPresenceCountChange]);

  if (!enabled) return null;

  return (
    <>
      {presence.users
        .filter((user) => user.cursor && user.cursor.x >= 0 && user.cursor.y >= 0)
        .map((presenceUser) => (
          <div
            key={presenceUser.id}
            className="pointer-events-none absolute z-[80]"
            style={{
              left: `${presenceUser.cursor!.x}px`,
              top: `${presenceUser.cursor!.y}px`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: presenceUser.color }} />
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg"
                style={{ backgroundColor: presenceUser.color }}
              >
                {presenceUser.name}
              </span>
            </div>
          </div>
        ))}
    </>
  );
}

const PENDING_INVITE_TOKEN_KEY = 'obsreview-pending-invite-token';

export interface EditorAppProps {
  runtime?: 'portal' | 'hook';
  initialDocumentId?: string;
}

const App: React.FC<EditorAppProps> = ({
  runtime = 'hook',
  initialDocumentId,
}) => {
  const { t } = useTranslation();
  const isPortalRuntime = runtime === 'portal';
  const cloudWorkspaceEnabled = isPortalRuntime && import.meta.env.VITE_FEATURE_CLOUD_WORKSPACE !== 'false';
  const raycastDocumentsEnabled = cloudWorkspaceEnabled && import.meta.env.VITE_FEATURE_RAYCAST_DOCUMENTS !== 'false';
  const livePresenceEnabled = cloudWorkspaceEnabled && import.meta.env.VITE_FEATURE_LIVE_PRESENCE !== 'false';
  const legacyShareReadOnlyEnabled = import.meta.env.VITE_FEATURE_LEGACY_SHARE_READONLY !== 'false';
  const [markdown, setMarkdown] = useState(PLAN_CONTENT);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [savePath, setSavePath] = useState<string>(() => {
    // Use note path directly
    const note = getNotePath();
    return note || '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // History for undo (Ctrl+Z)
  const [annotationHistory, setAnnotationHistory] = useState<string[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(() => {
    const savedUi = readEditorUiState();
    return typeof savedUi.selectedAnnotationId === 'string' ? savedUi.selectedAnnotationId : null;
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showExport, setShowExport] = useState(() => readLocalFlag(APP_MODAL_KEYS.showExport));
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(() => readLocalFlag(APP_MODAL_KEYS.showFeedbackPrompt));
  const [showGlobalCommentModal, setShowGlobalCommentModal] = useState(() => readLocalFlag(APP_MODAL_KEYS.showGlobalCommentModal));
  const [showHelpVideo, setShowHelpVideo] = useState(() => readLocalFlag(APP_MODAL_KEYS.showHelpVideo));
  const [showShortcutsModal, setShowShortcutsModal] = useState(() => readLocalFlag(APP_MODAL_KEYS.showShortcutsModal));
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    const savedUi = readEditorUiState();
    return typeof savedUi.isPanelOpen === 'boolean' ? savedUi.isPanelOpen : true;
  });
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(() => {
    const savedUi = readEditorUiState();
    return typeof savedUi.isSettingsPanelOpen === 'boolean' ? savedUi.isSettingsPanelOpen : false;
  });
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>(() => {
    const savedUi = readEditorUiState();
    if (isSettingsTab(savedUi.settingsTab ?? null)) {
      return savedUi.settingsTab as SettingsTab;
    }
    const savedTab = storage.getItem(SETTINGS_PANEL_TAB_KEY);
    return isSettingsTab(savedTab) ? savedTab : 'caminhos';
  });
  const [editorMode, setEditorMode] = useState<EditorMode>('selection');

  const [isApiMode, setIsApiMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<'approved' | 'denied' | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isFullEditMode, setIsFullEditMode] = useState(false);
  const [isSavingFullEdit, setIsSavingFullEdit] = useState(false);
  const [fullEditContent, setFullEditContent] = useState('');
  const [currentAuthorName, setCurrentAuthorName] = useState<string>('');
  const [currentAuthorAvatar, setCurrentAuthorAvatar] = useState<string | null>(null);
  const [cloudClient, setCloudClient] = useState<any | null>(null);
  const [cloudProfile, setCloudProfile] = useState<{ id: string; name: string } | null>(null);
  const [cloudNoteId, setCloudNoteId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(() => {
    if (initialDocumentId) return initialDocumentId;
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('document');
  });
  const [activeDocumentRole, setActiveDocumentRole] = useState<'owner' | 'editor' | 'viewer' | 'none'>('none');
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [trashDocuments, setTrashDocuments] = useState<TrashDocumentRecord[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [activePresenceCount, setActivePresenceCount] = useState(0);
  const viewerRef = useRef<ViewerHandle>(null);
  const headerRef = useRef<HTMLElement>(null);
  const documentAreaRef = useRef<HTMLElement>(null);
  const fullEditTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [annotationsLoadedFromCloud, setAnnotationsLoadedFromCloud] = useState(false);
  const [hasInitializedLocalAnnotations, setHasInitializedLocalAnnotations] = useState(() => isPortalRuntime);
  const cloudLoadedPathRef = useRef<string | null>(null);
  const localMarkdownWriteAtRef = useRef<number>(0);
  const activeAnnotations = useMemo(
    () => annotations.filter(annotation => !annotation.deletedAt),
    [annotations]
  );
  const deletedAnnotations = useMemo(
    () => annotations.filter(annotation => !!annotation.deletedAt),
    [annotations]
  );
  const noteSourcePath = useMemo(
    () => normalizeNoteSourcePath(savePath || getNotePath() || 'nota.md'),
    [savePath]
  );
  const canEditActiveDocument = activeDocumentRole === 'owner' || activeDocumentRole === 'editor' || !cloudWorkspaceEnabled;
  const resolvePublicShareUrl = useCallback(async (): Promise<string | null> => {
    if (!cloudWorkspaceEnabled || !cloudClient || !activeDocumentId) {
      return null;
    }

    return ensurePublicShareLink(cloudClient, activeDocumentId);
  }, [cloudWorkspaceEnabled, cloudClient, activeDocumentId]);

  useEffect(() => {
    if (!livePresenceEnabled || !activeDocumentId) {
      setActivePresenceCount(0);
    }
  }, [livePresenceEnabled, activeDocumentId]);

  useEffect(() => {
    if (!canEditActiveDocument && editorMode !== 'selection') {
      setEditorMode('selection');
    }
  }, [canEditActiveDocument, editorMode]);

  // URL-based sharing
  const {
    isSharedSession,
    isLoadingShared,
    shareUrl,
    shareUrlSize,
    shareError,
    pendingSharedAnnotations,
    clearPendingSharedAnnotations,
  } = useSharing(
    markdown,
    activeAnnotations,
    setMarkdown,
    setAnnotations,
    () => {
      // When loaded from share, mark as loaded
      setIsLoading(false);
    },
    legacyShareReadOnlyEnabled,
    cloudWorkspaceEnabled ? resolvePublicShareUrl : undefined,
  );

  // Track if annotations were loaded from localStorage to avoid re-saving immediately
  const [annotationsLoadedFromStorage, setAnnotationsLoadedFromStorage] = useState(false);

  // Apply shared annotations to DOM after they're loaded
  useEffect(() => {
    if (pendingSharedAnnotations && pendingSharedAnnotations.length > 0) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        // Clear existing highlights first (important when loading new share URL)
        viewerRef.current?.clearAllHighlights();
        viewerRef.current?.applySharedAnnotations(pendingSharedAnnotations.filter(annotation => !annotation.deletedAt));
        clearPendingSharedAnnotations();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingSharedAnnotations, clearPendingSharedAnnotations]);

  // Load annotations from localStorage when markdown is ready (and not from share)
  useEffect(() => {
    if (isPortalRuntime) return;
    if (isLoading || isLoadingShared || isSharedSession) return;

    const storedResult = loadAnnotations(markdown);
    const storedAnnotations = storedResult.value;
    setHasInitializedLocalAnnotations(true);
    if (storedResult.success && Array.isArray(storedAnnotations)) {
      // Validate and set annotations
      setAnnotations(storedAnnotations as Annotation[]);
      setAnnotationsLoadedFromStorage(true);

      // Apply highlights after a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        viewerRef.current?.clearAllHighlights();
        viewerRef.current?.applySharedAnnotations((storedAnnotations as Annotation[]).filter(annotation => !annotation.deletedAt));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [markdown, isLoading, isLoadingShared, isSharedSession, isPortalRuntime]);

  // Save annotations to localStorage when they change
  useEffect(() => {
    if (isPortalRuntime) return;
    // Don't save if we just loaded from storage (prevents unnecessary writes)
    if (annotationsLoadedFromStorage || annotationsLoadedFromCloud) {
      setAnnotationsLoadedFromStorage(false);
      setAnnotationsLoadedFromCloud(false);
      return;
    }

    // Don't save during initial load or if loaded from share URL
    if (isLoading || isLoadingShared) return;

    // Save annotations (including soft-deleted items for restore)
    saveAnnotations(markdown, annotations);
  }, [annotations, markdown, isLoading, isLoadingShared, annotationsLoadedFromStorage, annotationsLoadedFromCloud, isPortalRuntime]);

  // Intersection Observer for sticky bar - shows when header is out of viewport
  useEffect(() => {
    if (!headerRef.current || isSettingsPanelOpen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when header is NOT visible (threshold 0 means any part visible)
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [isSettingsPanelOpen]);

  useEffect(() => {
    storage.removeItem(LEGACY_SETTINGS_PANEL_OPEN_KEY);
  }, []);

  useEffect(() => {
    storage.setItem(SETTINGS_PANEL_TAB_KEY, settingsInitialTab);
  }, [settingsInitialTab]);

  useEffect(() => {
    writeEditorUiState({
      isPanelOpen,
      isSettingsPanelOpen,
      settingsTab: settingsInitialTab,
      selectedAnnotationId,
    });
  }, [isPanelOpen, isSettingsPanelOpen, settingsInitialTab, selectedAnnotationId]);

  useEffect(() => {
    writeLocalFlag(APP_MODAL_KEYS.showExport, showExport);
  }, [showExport]);

  useEffect(() => {
    writeLocalFlag(APP_MODAL_KEYS.showFeedbackPrompt, showFeedbackPrompt);
  }, [showFeedbackPrompt]);

  useEffect(() => {
    writeLocalFlag(APP_MODAL_KEYS.showGlobalCommentModal, showGlobalCommentModal);
  }, [showGlobalCommentModal]);

  useEffect(() => {
    writeLocalFlag(APP_MODAL_KEYS.showHelpVideo, showHelpVideo);
  }, [showHelpVideo]);

  useEffect(() => {
    writeLocalFlag(APP_MODAL_KEYS.showShortcutsModal, showShortcutsModal);
  }, [showShortcutsModal]);

  useEffect(() => {
    if (!documentsError) return;
    const timer = setTimeout(() => setDocumentsError(null), 4000);
    return () => clearTimeout(timer);
  }, [documentsError]);

  useEffect(() => {
    let cancelled = false;

    import('@obsidian-note-reviewer/security/supabase/client')
      .then((module) => {
        if (!cancelled) {
          setCloudClient(module.supabase);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCloudClient(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const syncDocumentQueryParam = (noteId: string | null) => {
    if (!isPortalRuntime || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (noteId) {
      url.searchParams.set('document', noteId);
    } else {
      url.searchParams.delete('document');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const reloadDocuments = async (preferredDocumentId?: string | null): Promise<string | null> => {
    if (!cloudClient || !cloudWorkspaceEnabled) return null;

    const docs = await listAccessibleDocuments(cloudClient);
    setDocuments(docs);

    if (docs.length === 0) return null;

    if (preferredDocumentId && docs.some((doc) => doc.id === preferredDocumentId)) {
      return preferredDocumentId;
    }

    if (activeDocumentId && docs.some((doc) => doc.id === activeDocumentId)) {
      return activeDocumentId;
    }

    return docs[0].id;
  };

  const openPortalDocumentById = async (documentId: string): Promise<void> => {
    if (!cloudClient || !cloudWorkspaceEnabled) return;

    const [openedDocument, role] = await Promise.all([
      openDocument(cloudClient, documentId),
      getCurrentUserRole(documentId),
    ]);
    const { document, annotations: loadedAnnotations } = openedDocument;
    const content = document.markdown || document.content || '';

    setActiveDocumentId(document.id);
    setActiveDocumentRole(role);
    setCloudNoteId(document.id);
    setMarkdown(content);
    setBlocks(parseMarkdownToBlocks(content));
    setAnnotations(loadedAnnotations);
    setAnnotationsLoadedFromCloud(true);
    setSelectedAnnotationId(null);
    setSavePath(document.sourcePath || `cloud/${document.title || document.id}.md`);
    cloudLoadedPathRef.current = document.sourcePath || document.id;
    syncDocumentQueryParam(document.id);

    const nextDocs = await listAccessibleDocuments(cloudClient);
    setDocuments(nextDocs);
  };

  const createAndOpenPortalDocument = async (): Promise<void> => {
    if (!cloudClient || !cloudWorkspaceEnabled) return;
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const created = await createDocument(cloudClient);
      setDocuments((prev) => [created, ...prev.filter((doc) => doc.id !== created.id)]);
      await openPortalDocumentById(created.id);
      setIsDocumentsModalOpen(false);
    } catch (error: any) {
      setDocumentsError(error?.message || 'Falha ao criar documento');
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    if (!cloudClient || !cloudWorkspaceEnabled) return;
    if (legacyShareReadOnlyEnabled && isLoadingShared) return;
    if (legacyShareReadOnlyEnabled && isSharedSession) return;

    let cancelled = false;

    const bootstrapWorkspace = async () => {
      setDocumentsLoading(true);
      setDocumentsError(null);

      try {
        const { data: authData } = await cloudClient.auth.getUser();
        const authUser = authData?.user;

        if (authUser?.id) {
          const resolvedProfile = await resolveCurrentWorkspaceProfile(cloudClient);
          const resolvedName =
            resolvedProfile?.name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email ||
            'Usuário';
          const resolvedAvatar =
            resolvedProfile?.avatarUrl ||
            (authUser.user_metadata?.avatar_url as string | null) ||
            null;

          if (!cancelled) {
            setCloudProfile({ id: authUser.id, name: resolvedName });
            setCurrentAuthorName(resolvedName);
            setCurrentAuthorAvatar(resolvedAvatar);
            updateDisplayName(resolvedName);
          }
        }

        const pendingInviteToken = typeof window !== 'undefined'
          ? window.sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY)
          : null;

        let preferredDocumentId = activeDocumentId || initialDocumentId || null;
        if (pendingInviteToken) {
          const acceptedDocumentId = await acceptInvite(pendingInviteToken);
          if (acceptedDocumentId) {
            preferredDocumentId = acceptedDocumentId;
          }
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
          }
        }

        const nextDocumentId = await reloadDocuments(preferredDocumentId);

        if (cancelled) return;

        if (!nextDocumentId) {
          const created = await createDocument(cloudClient);
          if (cancelled) return;
          setDocuments([created]);
          await openPortalDocumentById(created.id);
          return;
        }

        await openPortalDocumentById(nextDocumentId);
      } catch (error: any) {
        if (!cancelled) {
          setDocumentsError(error?.message || 'Falha ao carregar workspace em nuvem');
        }
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false);
          setIsLoading(false);
        }
      }
    };

    bootstrapWorkspace();

    return () => {
      cancelled = true;
    };
  }, [cloudClient, cloudWorkspaceEnabled, initialDocumentId, isSharedSession, isLoadingShared, legacyShareReadOnlyEnabled]);

  useEffect(() => {
    if (!cloudWorkspaceEnabled || !cloudClient || !activeDocumentId) return;

    const realtimeChannel = cloudClient.channel(`doc-sync-${activeDocumentId}`);

    const refreshAnnotationsFromCloud = async () => {
      try {
        const opened = await openDocument(cloudClient, activeDocumentId);
        setAnnotations(opened.annotations);
        setAnnotationsLoadedFromCloud(true);
      } catch {
        // no-op
      }
    };

    realtimeChannel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `id=eq.${activeDocumentId}` },
        (payload: any) => {
          const nextNote = (payload?.new || {}) as Record<string, unknown>;
          const previousNote = (payload?.old || {}) as Record<string, unknown>;
          const remoteNoteId = typeof nextNote.id === 'string' ? nextNote.id : activeDocumentId;
          const remoteTitle = typeof nextNote.title === 'string' ? nextNote.title : null;
          const remoteUpdatedAtIso = typeof nextNote.updated_at === 'string'
            ? nextNote.updated_at
            : new Date().toISOString();
          const remoteDeletedAt = typeof nextNote.deleted_at === 'string' ? nextNote.deleted_at : null;
          const wasDeleted = typeof previousNote.deleted_at === 'string' && previousNote.deleted_at.length > 0;
          const remoteMarkdown = nextNote.markdown || nextNote.content;
          const remoteUpdatedAt = new Date(nextNote.updated_at as string || 0).getTime();
          const isOwnWrite = typeof nextNote.updated_by === 'string' && nextNote.updated_by === cloudProfile?.id;

          if (remoteTitle) {
            setDocuments((prev) => prev.map((doc) => (
              doc.id === remoteNoteId
                ? { ...doc, title: remoteTitle, updatedAt: remoteUpdatedAtIso }
                : doc
            )));
          }

          if (remoteDeletedAt) {
            if (isOwnWrite) return;
            if (remoteNoteId === activeDocumentId) {
              setDocumentsError('Este documento foi movido para a lixeira por outro colaborador.');
              void (async () => {
                try {
                  const nextDocumentId = await reloadDocuments(null);
                  if (nextDocumentId) {
                    await openPortalDocumentById(nextDocumentId);
                    return;
                  }

                  setActiveDocumentId(null);
                  setActiveDocumentRole('none');
                  setCloudNoteId(null);
                  setMarkdown('');
                  setBlocks([]);
                  setAnnotations([]);
                  syncDocumentQueryParam(null);
                } catch {
                  setDocumentsError('Falha ao sincronizar documentos após exclusão.');
                }
              })();
            } else if (remoteNoteId) {
              setDocuments((prev) => prev.filter((doc) => doc.id !== remoteNoteId));
            }
            return;
          }

          if (wasDeleted && !remoteDeletedAt) {
            void reloadDocuments(remoteNoteId).catch(() => {});
          }

          if (isOwnWrite) return;
          if (typeof remoteMarkdown !== 'string' || !remoteMarkdown || Number.isNaN(remoteUpdatedAt)) return;
          if (remoteUpdatedAt < localMarkdownWriteAtRef.current) return;
          if (remoteMarkdown === markdown) return;

          setMarkdown(remoteMarkdown);
          setBlocks(parseMarkdownToBlocks(remoteMarkdown));
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'annotations', filter: `note_id=eq.${activeDocumentId}` },
        () => {
          refreshAnnotationsFromCloud();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          refreshAnnotationsFromCloud();
        },
      )
      .subscribe();

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [cloudWorkspaceEnabled, cloudClient, activeDocumentId, cloudProfile?.id, markdown]);

  useEffect(() => {
    if (isPortalRuntime) return;
    if (!cloudClient || isLoading || isLoadingShared || isSharedSession) return;
    if (!hasInitializedLocalAnnotations) return;
    if (!noteSourcePath) return;
    if (cloudLoadedPathRef.current === noteSourcePath) return;

    let cancelled = false;
    let highlightTimer: ReturnType<typeof setTimeout> | null = null;

    tryLoadCloudState(cloudClient, noteSourcePath, markdown, annotations).then((cloudState) => {
      if (cancelled || !cloudState) return;

      cloudLoadedPathRef.current = noteSourcePath;
      setCloudNoteId(cloudState.note?.id ?? null);

      if (cloudState.profile) {
        setCloudProfile(cloudState.profile as any);
        setCurrentAuthorName(cloudState.profile.name);
        setCurrentAuthorAvatar(cloudState.profile.avatarUrl);
        updateDisplayName(cloudState.profile.name);
      }

      setAnnotations(cloudState.annotations);
      setAnnotationsLoadedFromCloud(true);

      highlightTimer = setTimeout(() => {
        viewerRef.current?.clearAllHighlights();
        viewerRef.current?.applySharedAnnotations(cloudState.annotations.filter(annotation => !annotation.deletedAt));
      }, 150);
    });

    return () => {
      cancelled = true;
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, [cloudClient, noteSourcePath, markdown, isLoading, isLoadingShared, isSharedSession, hasInitializedLocalAnnotations, isPortalRuntime]);

  useEffect(() => {
    if (!cloudClient || !cloudNoteId || !cloudProfile) return;
    if (isLoading || isLoadingShared || isSharedSession) return;
    if (!canEditActiveDocument) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      trySyncCloudAnnotations(cloudClient, cloudNoteId, cloudProfile as any, annotations).then((updated) => {
        if (cancelled || !updated) return;
        const changed =
          updated.length !== annotations.length ||
          updated.some((annotation, index) => {
            const current = annotations[index];
            if (!current) return true;
            return (
              annotation.persistedId !== current.persistedId ||
              annotation.threadId !== current.threadId ||
              annotation.commentId !== current.commentId ||
              annotation.deletedAt !== current.deletedAt ||
              annotation.author !== current.author
            );
          });

        if (changed) {
          setAnnotations(updated);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cloudClient, cloudNoteId, cloudProfile, annotations, isLoading, isLoadingShared, isSharedSession]);

  useEffect(() => {
    if (!cloudWorkspaceEnabled || !cloudNoteId) return;
    if (annotations.length > 0) return;
    if (typeof window === 'undefined') return;

    const migrationKey = `obsidian-reviewer-cloud-migration:${cloudNoteId}`;
    if (window.localStorage.getItem(migrationKey) === '1') return;

    const legacyAnnotations = loadAnnotations(markdown);
    if (legacyAnnotations.success && Array.isArray(legacyAnnotations.value) && legacyAnnotations.value.length > 0) {
      setAnnotations(legacyAnnotations.value as Annotation[]);
    }

    window.localStorage.setItem(migrationKey, '1');
  }, [cloudWorkspaceEnabled, cloudNoteId, markdown, annotations.length]);

  useEffect(() => {
    if (!cloudClient || !cloudNoteId || !cloudProfile) return;
    if (isLoading || isLoadingShared || isSharedSession) return;
    if (!canEditActiveDocument) return;

    const timer = setTimeout(() => {
      localMarkdownWriteAtRef.current = Date.now();
      cloudClient
        .from('notes')
        .update({
          markdown,
          content: markdown,
          updated_by: cloudProfile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cloudNoteId);

      if (cloudWorkspaceEnabled) {
        setDocuments((prev) => prev.map((doc) => (
          doc.id === cloudNoteId
            ? { ...doc, markdown, content: markdown, updatedAt: new Date().toISOString() }
            : doc
        )));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cloudClient, cloudNoteId, cloudProfile, markdown, isLoading, isLoadingShared, isSharedSession, cloudWorkspaceEnabled, canEditActiveDocument]);


  // Check if we're in API mode (served from Bun hook server)
  // Skip if we loaded from a shared URL
  useEffect(() => {
    if (cloudWorkspaceEnabled) {
      setIsApiMode(false);
      return;
    }

    if (isLoadingShared) return; // Wait for share check to complete
    if (isSharedSession) return; // Already loaded from share

    fetch('/api/plan')
      .then(res => {
        if (!res.ok) throw new Error('Not in API mode');
        return res.json();
      })
      .then((data: { plan: string }) => {
        setMarkdown(data.plan);
        setIsApiMode(true);
      })
      .catch(() => {
        // Not in API mode - use default content
        setIsApiMode(false);
      })
      .finally(() => setIsLoading(false));
  }, [isLoadingShared, isSharedSession, cloudWorkspaceEnabled]);

  // Parse markdown with optional skeleton display for large content
  // Uses a threshold to avoid skeleton flash for fast parsing
  useEffect(() => {
    // Skip if still doing initial load (skeleton already shown)
    if (isLoading || isLoadingShared) {
      setBlocks(parseMarkdownToBlocks(markdown));
      return;
    }

    // For subsequent content changes, check if content is potentially large
    // Large content threshold: ~10KB of markdown typically takes noticeable time
    const LARGE_CONTENT_THRESHOLD = 10000;
    const PARSING_SKELETON_DELAY = 50; // ms before showing skeleton

    if (markdown.length < LARGE_CONTENT_THRESHOLD) {
      // Small content: parse immediately without skeleton
      setBlocks(parseMarkdownToBlocks(markdown));
      return;
    }

    // Large content: show skeleton if parsing takes longer than threshold
    let showSkeletonTimeout: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    // Schedule showing skeleton after delay (if parsing is slow)
    showSkeletonTimeout = setTimeout(() => {
      if (!isCancelled) {
        setIsParsing(true);
      }
    }, PARSING_SKELETON_DELAY);

    // Defer parsing to next frame to allow skeleton to display
    requestAnimationFrame(() => {
      if (isCancelled) return;

      const newBlocks = parseMarkdownToBlocks(markdown);

      // Clear timeout and hide skeleton
      if (showSkeletonTimeout) {
        clearTimeout(showSkeletonTimeout);
      }
      setIsParsing(false);
      setBlocks(newBlocks);
    });

    return () => {
      isCancelled = true;
      if (showSkeletonTimeout) {
        clearTimeout(showSkeletonTimeout);
      }
      setIsParsing(false);
    };
  }, [markdown, isLoading, isLoadingShared]);

  // Load file from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filePath = params.get('file');

    if (filePath) {
      fetch(`/api/load?path=${encodeURIComponent(filePath)}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.content) {
            const newBlocks = parseMarkdownToBlocks(data.content);
            setBlocks(newBlocks);
            console.log('✅ Nota carregada:', filePath);
          } else {
            console.error('❌ Erro ao carregar nota:', data.error);
          }
        })
        .catch(err => {
          console.error('❌ Erro ao carregar nota:', err);
        });
    }
  }, []);

  // Ctrl+Z to undo last annotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (annotationHistory.length > 0) {
          const lastAnnotationId = annotationHistory[annotationHistory.length - 1];
          // Remove annotation
          setAnnotations(prev => prev.filter(a => a.id !== lastAnnotationId));
          // Remove from history
          setAnnotationHistory(prev => prev.slice(0, -1));
          // Remove highlight from viewer
          viewerRef.current?.removeHighlight(lastAnnotationId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [annotationHistory]);

  // Global keyboard shortcuts for main actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when focused on input/textarea elements
      if (isInputFocused()) return;

      // Number keys for editor modes (1-4)
      if (!e.ctrlKey && !e.metaKey && e.key === '1') {
        e.preventDefault();
        setEditorMode('selection');
      }
      if (!e.ctrlKey && !e.metaKey && e.key === '2') {
        e.preventDefault();
        if (canEditActiveDocument) {
          setEditorMode('edit');
        }
      }
      if (!e.ctrlKey && !e.metaKey && e.key === '3') {
        e.preventDefault();
        handleEnterFullEditMode();
      }
      if (!e.ctrlKey && !e.metaKey && e.key === '4') {
        e.preventDefault();
        if (canEditActiveDocument) {
          setEditorMode('redline');
        }
      }

      // C for global comment (without modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setShowGlobalCommentModal(true);
      }

      // E for export (without modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExport(true);
      }

      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        if (savePath) handleSaveToVault();
      }

      // Ctrl+L to share (copy link)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'l') {
        e.preventDefault();
        if (shareUrl) {
          navigator.clipboard.writeText(shareUrl);
        }
      }

      // Ctrl/Cmd+K to open documents command modal
      if (raycastDocumentsEnabled && (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsDocumentsModalOpen(true);
      }

      // Ctrl/Cmd+N to create a new cloud document
      if (cloudWorkspaceEnabled && (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createAndOpenPortalDocument();
      }

      // ? to open keyboard shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
        setShowStickyBar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [savePath, editorMode, shareUrl, cloudWorkspaceEnabled, raycastDocumentsEnabled, canEditActiveDocument]);

  // Full edit mode keyboard shortcuts
  useEffect(() => {
    if (!isFullEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelFullEdit();
      }
      // Ctrl+Enter or Cmd+Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveFullEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullEditMode, fullEditContent, isSavingFullEdit]);

  // API mode handlers
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/approve', { method: 'POST' });
      setSubmitted('approved');
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: diffOutput })
      });
      setSubmitted('denied');
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleAddAnnotation = (ann: Annotation) => {
    const nextAnnotation: Annotation = {
      ...ann,
      author: ann.author || currentAuthorName || ann.author,
    };

    if (!canEditActiveDocument) {
      const isCommentType =
        nextAnnotation.type === AnnotationType.COMMENT ||
        nextAnnotation.type === AnnotationType.GLOBAL_COMMENT;
      if (!isCommentType) {
        return;
      }
    }

    setAnnotations(prev => [...prev, nextAnnotation]);
    setSelectedAnnotationId(nextAnnotation.id);
    setIsPanelOpen(true);
    // Add to history for undo (Ctrl+Z)
    setAnnotationHistory(prev => [...prev, nextAnnotation.id]);
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    if (!canEditActiveDocument) return;
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAnnotation = (id: string) => {
    if (!canEditActiveDocument) return;
    viewerRef.current?.removeHighlight(id);
    setAnnotations(prev =>
      prev.map(annotation =>
        annotation.id === id
          ? { ...annotation, deletedAt: Date.now() }
          : annotation
      )
    );
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  const handleRestoreLatestDeleted = () => {
    const latestDeleted = [...deletedAnnotations]
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))[0];

    if (!latestDeleted) return;

    setAnnotations(prev =>
      prev.map(annotation =>
        annotation.id === latestDeleted.id
          ? { ...annotation, deletedAt: undefined }
          : annotation
      )
    );

    setSelectedAnnotationId(latestDeleted.id);
    setIsPanelOpen(true);
  };

  const handleSelectAnnotation = (id: string | null) => {
    setSelectedAnnotationId(id);

    if (id) {
      // Find the highlighted element in the document
      const element = document.querySelector(`[data-bind-id="${id}"]`) as HTMLElement;
      if (element) {
        // Scroll to the element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add a brief highlight animation
        element.classList.add('annotation-flash');
        setTimeout(() => {
          element.classList.remove('annotation-flash');
        }, 1500);
      }
    }
  };

  const handleAddGlobalComment = (comment: string, author: string) => {
    const effectiveAuthor = author?.trim() || currentAuthorName || author;
    const newAnnotation: Annotation = {
      id: `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId: '', // Not tied to a specific block
      startOffset: 0,
      endOffset: 0,
      type: AnnotationType.GLOBAL_COMMENT,
      text: comment,
      originalText: '', // No selected text
      createdA: Date.now(),
      author: effectiveAuthor,
      isGlobal: true,
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
    setIsPanelOpen(true);
    setAnnotationHistory(prev => [...prev, newAnnotation.id]);
  };

  const handleVaultPathChange = (vaultPath: string) => {
    const notePath = getNotePath();
    if (vaultPath && notePath) {
      setSavePath(`${vaultPath}/${notePath}`);
    } else {
      setSavePath('');
    }
  };

  const handleNotePathChange = (notePath: string) => {
    if (cloudWorkspaceEnabled) {
      return;
    }
    setSavePath(notePath);
    cloudLoadedPathRef.current = null;
    setCloudNoteId(null);
  };

  const handleIdentityChange = (oldIdentity: string, newIdentity: string) => {
    const normalizedNewIdentity = newIdentity.trim();
    if (!normalizedNewIdentity) return;

    const aliases = new Set(
      [oldIdentity, currentAuthorName]
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value))
    );

    setCurrentAuthorName(normalizedNewIdentity);
    setCloudProfile(prev => (prev ? { ...prev, name: normalizedNewIdentity } : prev));
    setAnnotations(prev => prev.map(ann =>
      ann.author && aliases.has(ann.author.trim())
        ? { ...ann, author: normalizedNewIdentity }
        : ann
    ));
  };

  const handleNoteTypeChange = (tipo: TipoNota) => {
    // Just save the type, path comes from handleNotePathChange
  };

  const handleNoteNameChange = (name: string) => {
    // Note name is handled via handleNotePathChange
  };

  const handleOpenDocumentsModal = () => {
    if (!raycastDocumentsEnabled) return;
    setIsDocumentsModalOpen(true);
  };

  const handleOpenCollaborate = () => {
    setSettingsInitialTab('colaboracao');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('obsreview-showInviteForm', 'true');
      window.localStorage.setItem('obsreview-inviteRole', 'editor');
      window.localStorage.removeItem('obsreview-inviteError');
    }
    setIsSettingsPanelOpen(true);
    setShowStickyBar(false);
  };

  const normalizeDocumentPermissionError = (
    error: unknown,
    fallback: string,
    mode: 'owner' | 'owner_or_editor' | 'generic' = 'generic',
  ): string => {
    const raw = String((error as any)?.message || '').trim();
    const lowered = raw.toLowerCase();
    if (lowered.includes('row-level security policy')) {
      if (mode === 'owner') return 'Somente o proprietário do documento pode fazer esta ação.';
      if (mode === 'owner_or_editor') return 'Somente proprietário ou editor podem fazer esta ação.';
      return 'Você não tem permissão para esta ação neste documento.';
    }
    return raw || fallback;
  };

  const handleSelectDocument = async (documentId: string) => {
    if (!cloudWorkspaceEnabled) return;
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      await openPortalDocumentById(documentId);
    } catch (error: any) {
      setDocumentsError(error?.message || 'Falha ao abrir documento');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!cloudClient || !cloudWorkspaceEnabled) return;
    try {
      // Find the document before removing it (for localStorage cleanup)
      const docToDelete = documents.find((doc) => doc.id === documentId);

      await softDeleteDocument(cloudClient, documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      // Clear local annotations cache for this document
      if (docToDelete?.markdown) {
        clearAnnotations(docToDelete.markdown);
      }

      // If we deleted the active document, open the next available one
      if (activeDocumentId === documentId) {
        const remaining = documents.filter((doc) => doc.id !== documentId);
        if (remaining.length > 0) {
          await openPortalDocumentById(remaining[0].id);
        } else {
          setActiveDocumentId(null);
          setCloudNoteId(null);
          setMarkdown('');
          setBlocks([]);
          setAnnotations([]);
          syncDocumentQueryParam(null);
        }
      }

      setIsDocumentsModalOpen(false);
      await handleOpenTrash();
    } catch (error: any) {
      console.error('Falha ao excluir documento:', error);
      setDocumentsError(
        normalizeDocumentPermissionError(
          error,
          'Falha ao mover documento para a lixeira.',
          'owner',
        ),
      );
    }
  };

  const handleRenameDocument = async (documentId: string, newTitle: string) => {
    if (!cloudClient || !cloudWorkspaceEnabled) return;
    try {
      const updated = await renameDocument(cloudClient, documentId, newTitle);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, title: updated.title, updatedAt: updated.updatedAt } : doc,
        ),
      );
    } catch (error: any) {
      console.error('Falha ao renomear documento:', error);
      setDocumentsError(
        normalizeDocumentPermissionError(
          error,
          'Falha ao renomear documento.',
          'owner_or_editor',
        ),
      );
    }
  };

  const handleOpenTrash = async () => {
    if (!cloudClient) return;
    setIsDocumentsModalOpen(false);
    setIsTrashModalOpen(true);
    setTrashLoading(true);
    try {
      // Purge expired documents silently
      await purgeExpiredDocuments(cloudClient).catch(() => {});
      const trashDocs = await listTrashDocuments(cloudClient);
      setTrashDocuments(trashDocs);
    } catch (error: any) {
      console.error('Falha ao carregar lixeira:', error);
    } finally {
      setTrashLoading(false);
    }
  };

  const handleRestoreDocument = async (documentId: string) => {
    if (!cloudClient) return;
    try {
      await restoreDocument(cloudClient, documentId);
      setTrashDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      // Refresh main documents list
      const docs = await listAccessibleDocuments(cloudClient);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Falha ao restaurar documento:', error);
      setDocumentsError(
        normalizeDocumentPermissionError(
          error,
          'Falha ao restaurar documento.',
          'owner',
        ),
      );
    }
  };

  const handlePermanentDeleteDocument = async (documentId: string) => {
    if (!cloudClient) return;
    try {
      await permanentDeleteDocument(cloudClient, documentId);
      setTrashDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error: any) {
      console.error('Falha ao excluir permanentemente:', error);
      setDocumentsError(
        normalizeDocumentPermissionError(
          error,
          'Falha ao excluir documento permanentemente.',
          'owner',
        ),
      );
    }
  };

  const reconstructMarkdownFromBlocks = (blocks: Block[]): string => {
    return blocks.map(block => {
      if (block.type === 'frontmatter') {
        return `---\n${block.content}\n---`;
      }
      return block.content;
    }).join('\n\n');
  };

  // Full edit mode handlers
  const handleEnterFullEditMode = () => {
    if (!canEditActiveDocument) return;
    // Reconstruct markdown from blocks
    const currentMarkdown = reconstructMarkdownFromBlocks(blocks);
    setFullEditContent(currentMarkdown);
    setIsFullEditMode(true);
    // Focus textarea after render
    setTimeout(() => {
      if (fullEditTextareaRef.current) {
        fullEditTextareaRef.current.focus();
        fullEditTextareaRef.current.setSelectionRange(0, 0);
      }
    }, 100);
  };

  const handleSaveFullEdit = async () => {
    if (isSavingFullEdit) return;

    setIsSavingFullEdit(true);
    const startedAt = Date.now();

    try {
      // Update markdown and reparse blocks
      setMarkdown(fullEditContent);
      const newBlocks = parseMarkdownToBlocks(fullEditContent);
      setBlocks(newBlocks);

      const elapsed = Date.now() - startedAt;
      const minimumDuration = 500;
      if (elapsed < minimumDuration) {
        await new Promise((resolve) => setTimeout(resolve, minimumDuration - elapsed));
      }

      setIsFullEditMode(false);
    } finally {
      setIsSavingFullEdit(false);
    }
  };

  const handleCancelFullEdit = () => {
    if (isSavingFullEdit) return;
    setIsFullEditMode(false);
    setFullEditContent('');
  };

  // State for showing copy feedback toast
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleSaveToVault = async () => {
    if (cloudWorkspaceEnabled) {
      if (!canEditActiveDocument) {
        setSaveError('Você possui acesso somente leitura neste documento.');
        return;
      }
      setIsSaving(true);
      setSaveError(null);
      try {
        if (cloudClient && cloudNoteId && cloudProfile) {
          localMarkdownWriteAtRef.current = Date.now();
          await cloudClient
            .from('notes')
            .update({
              markdown,
              content: markdown,
              updated_by: cloudProfile.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', cloudNoteId);
        }
      } finally {
        setTimeout(() => setIsSaving(false), 250);
      }
      return;
    }

    if (!savePath.trim()) {
      setSaveError(t('app.configurePath'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // CASO 1: TEM ANOTAÇÕES → Fazer Alterações (deny com feedback)
      if (activeAnnotations.length > 0) {
        console.log('🟠 Solicitando alterações com', activeAnnotations.length, 'anotações');

        if (isApiMode) {
          // Envia feedback para Claude Code
          await fetch('/api/deny', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: diffOutput })
          });
          setSubmitted('denied');
          console.log('✅ Alterações solicitadas ao Claude Code!');
        } else {
          // FALLBACK: Não está em API mode - copiar diff para clipboard
          try {
            await navigator.clipboard.writeText(diffOutput);
            setShowCopyToast(true);
            setTimeout(() => setShowCopyToast(false), 3000);
            console.log('📋 Diff copiado para clipboard!');
          } catch (clipboardError) {
            console.error('❌ Erro ao copiar para clipboard:', clipboardError);
            setSaveError(t('app.copyChangesError'));
          }
        }
        return;
      }

      // CASO 2: SEM ANOTAÇÕES → Salvar no Obsidian e Aprovar
      console.log('🟣 Salvando nota no Obsidian...');

      const content = reconstructMarkdownFromBlocks(blocks);
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          path: savePath
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || t('app.saveUnknownError'));
      }

      console.log('✅ Nota salva com sucesso:', savePath);

      // Se estiver em API mode, também aprovar automaticamente
      if (isApiMode) {
        console.log('🎯 Aprovando automaticamente...');
        try {
          await fetch('/api/approve', { method: 'POST' });
          setSubmitted('approved');
          console.log('✅ Aprovado com sucesso!');
        } catch (approveError) {
          console.error('⚠️ Erro ao aprovar:', approveError);
          // Não falha se aprovação der erro - nota já foi salva
        }
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('common.unknownError'));
    } finally {
      setIsSaving(false);
    }
  };

  const diffOutput = useMemo(() => exportDiff(blocks, activeAnnotations), [blocks, activeAnnotations]);

  // Theme shortcut component (must be inside ThemeProvider)
  const ThemeShortcut = () => {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isInputFocused()) return;

        // D for dark/light toggle
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          // Toggle between light and dark
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [theme, setTheme]);

    return null;
  };

  const fullEditOverlay =
    isFullEditMode && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 top-0 left-0 z-[200] w-screen h-screen bg-background flex flex-col">
          {/* Full Edit Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-border/50 bg-card/50 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-semibold">{t('app.editMode')}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {fullEditContent.length} {t('app.characters')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelFullEdit}
                disabled={isSavingFullEdit}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveFullEdit}
                disabled={isSavingFullEdit}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingFullEdit ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSavingFullEdit ? t('app.saving') : t('app.saveChanges')}
              </button>
            </div>
          </div>

          {/* Full Edit Content */}
          <div className="flex-1 overflow-hidden flex">
            <textarea
              ref={fullEditTextareaRef}
              value={fullEditContent}
              onChange={(e) => setFullEditContent(e.target.value)}
              disabled={isSavingFullEdit}
              className="flex-1 w-full h-full p-6 md:p-8 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none border-none"
              placeholder={t('app.fullEditPlaceholder')}
              spellCheck={false}
            />
          </div>

          {/* Full Edit Footer with tips */}
          <div className="h-10 flex items-center justify-between px-4 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{t('app.escToCancel')}</span>
              <span>{t('app.ctrlEnterToSave')}</span>
            </div>
            <div>
              {t('app.directMarkdownEdit')}
            </div>
          </div>

          {isSavingFullEdit && (
            <div className="absolute inset-0 z-[220] bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-card border border-border rounded-xl shadow-2xl px-6 py-5 flex items-center gap-3">
                <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium text-foreground">{t('app.savingChanges')}</span>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )
      : null;

  return (
    <ThemeProvider defaultTheme="light">
      <ThemeShortcut />
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Show ONLY Settings when open */}
        {isSettingsPanelOpen ? (
          <SettingsPanel
            isOpen={isSettingsPanelOpen}
            onClose={() => {
              setIsSettingsPanelOpen(false);
              setShowStickyBar(false);
            }}
            onIdentityChange={handleIdentityChange}
            onNoteTypeChange={handleNoteTypeChange}
            onNotePathChange={handleNotePathChange}
            onNoteNameChange={handleNoteNameChange}
            activeDocumentId={activeDocumentId || undefined}
            initialTab={settingsInitialTab}
            onTabChange={setSettingsInitialTab}
          />
        ) : (
          <>
        {/* Minimal Header */}
        <header ref={headerRef} className="h-12 flex items-center justify-between px-2 md:px-4 border-b border-border/50 bg-card/50 backdrop-blur-xl z-50">
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src={obsreviewLogo}
              alt="Obsidian Note Reviewer"
              className="w-5 h-5 rounded object-contain opacity-70"
            />
            {cloudWorkspaceEnabled && (
              <div className="hidden md:flex items-center gap-2">
                <span className="max-w-[220px] truncate text-xs font-medium text-muted-foreground">
                  {documents.find((doc) => doc.id === activeDocumentId)?.title || 'Documento'}
                </span>
                {activeDocumentRole !== 'none' && (
                  <span className="rounded-md border border-border/60 bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {activeDocumentRole}
                  </span>
                )}
                {activePresenceCount > 0 && (
                  <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    {activePresenceCount} editando agora
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Salvar/Alterações - PRIMEIRO da esquerda */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !savePath || !canEditActiveDocument}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${isSaving || !savePath
                  ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                  : activeAnnotations.length > 0
                    ? 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/40'
                    : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40'
                }
              `}
              title={
                !canEditActiveDocument
                  ? 'Apenas leitura para este documento'
                  : !savePath
                  ? t('app.configurePath')
                  : activeAnnotations.length > 0
                    ? t('app.makeChangesInClaude')
                    : t('app.saveNoteToObsidian')
              }
            >
              {activeAnnotations.length > 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden md:inline">{isSaving ? t('app.processing') : t('app.makeChanges')}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span className="hidden md:inline">{isSaving ? t('app.saving') : t('app.saveToObsidian')}</span>
                </>
              )}
            </button>

            {/* ModeToggle - Segundo da esquerda */}
            <ModeToggle />

            {/* Help - Como funciona - Terceiro da esquerda */}
            <button
              onClick={() => setShowHelpVideo(true)}
              className="p-1.5 rounded-md text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t('app.howItWorks')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Atalhos - Quarto da esquerda */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 rounded-md text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t('app.keyboardShortcuts')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {/* Ícone de teclado - Keyboard */}
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h.01M15 13h.01M7 17h10" />
              </svg>
            </button>

            {raycastDocumentsEnabled && (
              <button
                onClick={handleOpenDocumentsModal}
                className="p-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Documentos (Ctrl/Cmd+K)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </button>
            )}

            {cloudWorkspaceEnabled && activeDocumentId && (
              <button
                onClick={handleOpenCollaborate}
                className="p-1.5 rounded-md text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-all"
                title={t('app.collaborate')}
                aria-label={t('app.collaborate')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M17 20H7m10 0v-2c0-.653-.126-1.277-.355-1.848M7 20H2v-2a4 4 0 015-3.87M7 20v-2c0-.653.126-1.277.355-1.848m0 0a5 5 0 019.29 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            )}

            {/* Compartilhar (ex-Exportar) */}
            <button
              onClick={() => setShowExport(true)}
              className="p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
              title={t('app.share')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden md:inline">{t('app.share')}</span>
            </button>

            {/* Toggle Painel */}
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                isPanelOpen
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={isPanelOpen ? t('app.hideAnnotationPanel') : t('app.showAnnotationPanel')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" fill="currentColor" fillOpacity="0.16" />
                <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Configurações - ÚLTIMO da direita */}
            <button
              onClick={() => {
                setIsSettingsPanelOpen(!isSettingsPanelOpen);
                if (!isSettingsPanelOpen) setShowStickyBar(false);
              }}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                isSettingsPanelOpen
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={t('app.settings')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {isApiMode && (
              <>
                <div className="w-px h-5 bg-border/50 mx-1 hidden md:block" />

                <button
                  onClick={() => {
                    if (activeAnnotations.length === 0) {
                      setShowFeedbackPrompt(true);
                    } else {
                      handleDeny();
                    }
                  }}
                  disabled={isSubmitting}
                  className={`p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium transition-all ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30'
                  }`}
                  title={t('app.requestChanges')}
                >
                  <svg className="w-4 h-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="hidden md:inline">{isSubmitting ? t('app.sending') : t('app.requestChanges')}</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className={`px-2 py-1 md:px-2.5 rounded-md text-xs font-medium transition-all ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-green-600 text-white hover:bg-green-500'
                  }`}
                  title={t('app.approveNote')}
                >
                  <span className="md:hidden">{isSubmitting ? '...' : 'OK'}</span>
                  <span className="hidden md:inline">{isSubmitting ? t('app.approving') : t('app.approveNote')}</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Sticky Action Bar - appears when header scrolls out of view */}
        {showStickyBar && !isSettingsPanelOpen && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {activeAnnotations.length} {t('app.annotations' + (activeAnnotations.length !== 1 ? '' : '_one'), { count: activeAnnotations.length })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão principal - Fazer Alterações ou Salvar */}
                <button
                  onClick={handleSaveToVault}
                  disabled={isSaving || !savePath || !canEditActiveDocument}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${isSaving || !savePath
                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                      : activeAnnotations.length > 0
                        ? 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/40'
                        : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40'
                    }
                  `}
                >
                  {activeAnnotations.length > 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {isSaving ? t('app.processing') : t('app.makeChanges')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isSaving ? t('app.saving') : t('app.save')}
                    </>
                  )}
                </button>

                {/* ModeToggle */}
                <ModeToggle />

                {/* Help - Como funciona */}
                <button
                  onClick={() => setShowHelpVideo(true)}
                  className="p-1.5 rounded-md text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                  title={t('app.howItWorks')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Atalhos - ÍCONE DE TECLADO */}
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="p-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  title={t('app.keyboardShortcuts')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {/* Ícone de teclado - Keyboard */}
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h.01M15 13h.01M7 17h10" />
                  </svg>
                </button>

                {raycastDocumentsEnabled && (
                  <button
                    onClick={handleOpenDocumentsModal}
                    className="p-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Documentos (Ctrl/Cmd+K)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                  </button>
                )}

                {cloudWorkspaceEnabled && activeDocumentId && (
                  <button
                    onClick={handleOpenCollaborate}
                    className="p-1.5 rounded-md text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-all"
                    title={t('app.collaborate')}
                    aria-label={t('app.collaborate')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M17 20H7m10 0v-2c0-.653-.126-1.277-.355-1.848M7 20H2v-2a4 4 0 015-3.87M7 20v-2c0-.653.126-1.277.355-1.848m0 0a5 5 0 019.29 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}

                {/* Compartilhar (ex-Exportar) */}
                <button
                  onClick={() => setShowExport(true)}
                  className="p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                  title={t('app.share')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="hidden md:inline">{t('app.share')}</span>
                </button>

                {/* Toggle painel de anotações */}
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                    isPanelOpen
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={isPanelOpen ? t('app.hideAnnotationPanel') : t('app.showAnnotationPanel')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" fill="currentColor" fillOpacity="0.16" />
                    <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Configurações - ÚLTIMO da direita */}
                <button
                  onClick={() => {
                    setIsSettingsPanelOpen(true);
                    setShowStickyBar(false);
                  }}
                  className="p-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  title={t('app.settings')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document Area */}
          <main ref={documentAreaRef} className="relative flex-1 overflow-y-auto bg-grid">
            {/* Mode Switcher - Floating */}
            <div className="sticky top-3 z-[60] mx-3 md:mx-8 w-fit">
              <ModeSwitcher
                mode={editorMode}
                onChange={(nextMode) => {
                  if (!canEditActiveDocument && nextMode !== 'selection') return;
                  setEditorMode(nextMode);
                }}
                onEditMarkdown={handleEnterFullEditMode}
                onGlobalComment={() => setShowGlobalCommentModal(true)}
              />
            </div>
            <div className="min-h-full flex flex-col items-center p-3 md:p-8 pt-3">

              {/* Show skeleton during initial load or large content parsing */}
              {(isLoading || isLoadingShared || isParsing) ? (
                <ViewerSkeleton />
              ) : (
                <Viewer
                  ref={viewerRef}
                  blocks={blocks}
                  markdown={markdown}
                  annotations={activeAnnotations}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onSelectAnnotation={setSelectedAnnotationId}
                  selectedAnnotationId={selectedAnnotationId}
                  mode={showExport ? 'selection' : editorMode}
                  onBlockChange={setBlocks}
                  currentAuthor={currentAuthorName}
                />
              )}
            </div>

            {livePresenceEnabled && cloudWorkspaceEnabled && activeDocumentId && (
              <LivePresenceOverlay
                enabled={livePresenceEnabled}
                documentId={activeDocumentId}
                containerRef={documentAreaRef}
                onPresenceCountChange={setActivePresenceCount}
              />
            )}
          </main>

          {/* Annotation Panel */}
          <AnnotationPanel
            isOpen={isPanelOpen}
            blocks={blocks}
            annotations={activeAnnotations}
            selectedId={selectedAnnotationId}
            onSelect={handleSelectAnnotation}
            onDelete={handleDeleteAnnotation}
            onRestoreLastDeleted={handleRestoreLatestDeleted}
            deletedCount={deletedAnnotations.length}
            shareUrl={shareUrl}
          />
        </div>

        {raycastDocumentsEnabled && (
          <>
            <RaycastDocumentsModal
              isOpen={isDocumentsModalOpen}
              loading={documentsLoading}
              documents={documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                updatedAt: doc.updatedAt,
              }))}
              activeDocumentId={activeDocumentId}
              onClose={() => setIsDocumentsModalOpen(false)}
              onSelectDocument={handleSelectDocument}
              onCreateDocument={createAndOpenPortalDocument}
              onDeleteDocument={handleDeleteDocument}
              onRenameDocument={handleRenameDocument}
              onOpenTrash={handleOpenTrash}
            />
            <TrashDocumentsModal
              isOpen={isTrashModalOpen}
              loading={trashLoading}
              documents={trashDocuments}
              onClose={() => setIsTrashModalOpen(false)}
              onRestore={handleRestoreDocument}
              onPermanentDelete={handlePermanentDeleteDocument}
            />
          </>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          initialTab="share"
          shareUrl={shareUrl}
          shareUrlSize={shareUrlSize}
          shareError={shareError}
          diffOutput={diffOutput}
          annotationCount={activeAnnotations.length}

        />

        {/* Global Comment Input Modal */}
        <GlobalCommentInput
          isOpen={showGlobalCommentModal}
          onClose={() => setShowGlobalCommentModal(false)}
          onSubmit={handleAddGlobalComment}
          defaultAuthor={currentAuthorName}
        />

        {/* Help Video Modal */}
        <HowItWorksModal isOpen={showHelpVideo} onClose={() => setShowHelpVideo(false)} />

        {/* Feedback prompt dialog */}
        {showFeedbackPrompt && (
          <BaseModal
            isOpen={showFeedbackPrompt}
            onRequestClose={() => setShowFeedbackPrompt(false)}
            closeOnBackdropClick={false}
            overlayClassName="z-50"
            contentClassName="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold">{t('app.addAnnotationsTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {t('app.addAnnotationsDescription')}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFeedbackPrompt(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </BaseModal>
        )}

        {/* Completion overlay - shown after approve/deny */}
        {submitted && (
          <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-8">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                submitted === 'approved'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-accent/20 text-accent'
              }`}>
                {submitted === 'approved' ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {submitted === 'approved' ? t('decisionBar.noteApproved') : t('decisionBar.changesRequested')}
                </h2>
                <p className="text-muted-foreground">
                  {submitted === 'approved'
                    ? t('decisionBar.willBeSaved')
                    : t('decisionBar.willReview')}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span dangerouslySetInnerHTML={{ __html: t('decisionBar.returnToTerminal') }} />
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Update notification */}

        {fullEditOverlay}

        {/* Copy to clipboard toast */}
        {showCopyToast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-card border border-border rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('app.changesCopied')}</p>
                <p className="text-xs text-muted-foreground">{t('app.pasteInClaude')}</p>
              </div>
            </div>
          </div>
        )}

        {documentsError && (
          <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 shadow-lg dark:text-red-300">
            {documentsError}
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />

      </div>
    </ThemeProvider>
  );
};

export default App;
