import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@obsidian-note-reviewer/ui/i18n/config'; // Initialize i18n
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
import { useSharing } from '@obsidian-note-reviewer/ui/hooks/useSharing';
import {
  storage,
  getVaultPath,
  getNotePath,
  setVaultPath,
  setNotePath,
  getNoteType,
  saveAnnotations,
  loadAnnotations
} from '@obsidian-note-reviewer/ui/utils/storage';
import { isInputFocused, formatTooltipWithShortcut } from '@obsidian-note-reviewer/ui/utils/shortcuts';
import { type TipoNota } from '@obsidian-note-reviewer/ui/utils/notePaths';

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

const App: React.FC = () => {
  const { t } = useTranslation();
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
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [showGlobalCommentModal, setShowGlobalCommentModal] = useState(false);
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('selection');

  const [isApiMode, setIsApiMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<'approved' | 'denied' | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isFullEditMode, setIsFullEditMode] = useState(false);
  const [fullEditContent, setFullEditContent] = useState('');
  const viewerRef = useRef<ViewerHandle>(null);
  const headerRef = useRef<HTMLElement>(null);
  const fullEditTextareaRef = useRef<HTMLTextAreaElement>(null);

  // URL-based sharing
  const {
    isSharedSession,
    isLoadingShared,
    shareUrl,
    shareUrlSize,
    pendingSharedAnnotations,
    clearPendingSharedAnnotations,
  } = useSharing(
    markdown,
    annotations,
    setMarkdown,
    setAnnotations,
    () => {
      // When loaded from share, mark as loaded
      setIsLoading(false);
    }
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
        viewerRef.current?.applySharedAnnotations(pendingSharedAnnotations);
        clearPendingSharedAnnotations();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingSharedAnnotations, clearPendingSharedAnnotations]);

  // Load annotations from localStorage when markdown is ready (and not from share)
  useEffect(() => {
    if (isLoading || isLoadingShared || isSharedSession) return;

    const storedAnnotations = loadAnnotations(markdown);
    if (storedAnnotations && Array.isArray(storedAnnotations) && storedAnnotations.length > 0) {
      // Validate and set annotations
      setAnnotations(storedAnnotations as Annotation[]);
      setAnnotationsLoadedFromStorage(true);

      // Apply highlights after a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        viewerRef.current?.clearAllHighlights();
        viewerRef.current?.applySharedAnnotations(storedAnnotations as Annotation[]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [markdown, isLoading, isLoadingShared, isSharedSession]);

  // Save annotations to localStorage when they change
  useEffect(() => {
    // Don't save if we just loaded from storage (prevents unnecessary writes)
    if (annotationsLoadedFromStorage) {
      setAnnotationsLoadedFromStorage(false);
      return;
    }

    // Don't save during initial load or if loaded from share URL
    if (isLoading || isLoadingShared) return;

    // Save annotations (including empty array to clear previous state)
    saveAnnotations(markdown, annotations);
  }, [annotations, markdown, isLoading, isLoadingShared, annotationsLoadedFromStorage]);

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


  // Check if we're in API mode (served from Bun hook server)
  // Skip if we loaded from a shared URL
  useEffect(() => {
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
  }, [isLoadingShared, isSharedSession]);

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
        setEditorMode('edit');
      }
      if (!e.ctrlKey && !e.metaKey && e.key === '3') {
        e.preventDefault();
        handleEnterFullEditMode();
      }
      if (!e.ctrlKey && !e.metaKey && e.key === '4') {
        e.preventDefault();
        setEditorMode('redline');
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

      // ? to open keyboard shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
        setShowStickyBar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [savePath, editorMode, shareUrl]);

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
  }, [isFullEditMode, fullEditContent]);

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
    setAnnotations(prev => [...prev, ann]);
    setSelectedAnnotationId(ann.id);
    setIsPanelOpen(true);
    // Add to history for undo (Ctrl+Z)
    setAnnotationHistory(prev => [...prev, ann.id]);
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAnnotation = (id: string) => {
    viewerRef.current?.removeHighlight(id);
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
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
    const newAnnotation: Annotation = {
      id: `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId: '', // Not tied to a specific block
      startOffset: 0,
      endOffset: 0,
      type: AnnotationType.GLOBAL_COMMENT,
      text: comment,
      originalText: '', // No selected text
      createdA: Date.now(),
      author,
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
    setSavePath(notePath);
  };

  const handleIdentityChange = (oldIdentity: string, newIdentity: string) => {
    setAnnotations(prev => prev.map(ann =>
      ann.author === oldIdentity ? { ...ann, author: newIdentity } : ann
    ));
  };

  const handleNoteTypeChange = (tipo: TipoNota) => {
    // Just save the type, path comes from handleNotePathChange
  };

  const handleNoteNameChange = (name: string) => {
    // Note name is handled via handleNotePathChange
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

  const handleSaveFullEdit = () => {
    // Update markdown and reparse blocks
    setMarkdown(fullEditContent);
    const newBlocks = parseMarkdownToBlocks(fullEditContent);
    setBlocks(newBlocks);
    setIsFullEditMode(false);
  };

  const handleCancelFullEdit = () => {
    setIsFullEditMode(false);
    setFullEditContent('');
  };

  // State for showing copy feedback toast
  // State for share dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // State for showing copy feedback toast
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleSaveToVault = async () => {
    if (!savePath.trim()) {
      setSaveError('Configure o caminho nas configurações');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // CASO 1: TEM ANOTAÇÕES → Fazer Alterações (deny com feedback)
      if (annotations.length > 0) {
        console.log('🟠 Solicitando alterações com', annotations.length, 'anotações');

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
            setSaveError('Erro ao copiar alterações para clipboard');
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
        throw new Error(result.error || 'Erro ao salvar');
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
      setSaveError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  const diffOutput = useMemo(() => exportDiff(blocks, annotations), [blocks, annotations]);

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

  return (
    <ThemeProvider defaultTheme="dark">
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
          />
        ) : (
          <>
        {/* Minimal Header */}
        <header ref={headerRef} className="h-12 flex items-center justify-between px-2 md:px-4 border-b border-border/50 bg-card/50 backdrop-blur-xl z-50">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs text-muted-foreground font-mono opacity-60">
              v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {isApiMode && (
              <>
                <button
                  onClick={() => {
                    if (annotations.length === 0) {
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
                  title="Solicitar Alterações"
                >
                  <svg className="w-4 h-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="hidden md:inline">{isSubmitting ? 'Enviando...' : 'Solicitar Alterações'}</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className={`px-2 py-1 md:px-2.5 rounded-md text-xs font-medium transition-all ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-green-600 text-white hover:bg-green-500'
                  }`}
                  title="Aprovar Nota"
                >
                  <span className="md:hidden">{isSubmitting ? '...' : 'OK'}</span>
                  <span className="hidden md:inline">{isSubmitting ? 'Aprovando...' : 'Aprovar'}</span>
                </button>

                <div className="w-px h-5 bg-border/50 mx-1 hidden md:block" />
              </>
            )}


            {/* Botão Salvar/Alterações - Condicional */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !savePath}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${isSaving || !savePath
                  ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                  : annotations.length > 0
                    ? 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/40'
                    : 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 border border-purple-500/40'
                }
              `}
              title={
                !savePath
                  ? t('app.configurePath')
                  : annotations.length > 0
                    ? t('app.makeChangesInClaude')
                    : t('app.saveNoteToObsidian')
              }
            >
              {annotations.length > 0 ? (
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

            {/* Help Button - Opens video directly */}
            <button
              onClick={() => setShowHelpVideo(true)}
              className="p-1.5 rounded-md text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t('app.howItWorks')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 rounded-md text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t('app.keyboardShortcuts')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
              title={t('app.export')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden md:inline">{t('app.export')}</span>
            </button>

            <button
              onClick={() => setShowShareDialog(true)}
              className="p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium bg-blue-600/20 text-blue-600 hover:bg-blue-600/30 transition-colors flex items-center gap-1.5"
              title={t('app.share')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden md:inline">{t('app.share')}</span>
            </button>
          </div>
        </header>

        {/* Sticky Action Bar - appears when header scrolls out of view */}
        {showStickyBar && !isSettingsPanelOpen && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {annotations.length} {t('app.annotations' + (annotations.length !== 1 ? '' : '_one'), { count: annotations.length })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão principal - Fazer Alterações ou Salvar */}
                <button
                  onClick={handleSaveToVault}
                  disabled={isSaving || !savePath}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${isSaving || !savePath
                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                      : annotations.length > 0
                        ? 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/40'
                        : 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 border border-purple-500/40'
                    }
                  `}
                >
                  {annotations.length > 0 ? (
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

                {/* Exportar */}
                <button
                  onClick={() => setShowExport(true)}
                  className="p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                  title={t('app.export')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="hidden md:inline">{t('app.export')}</span>
                </button>

                {/* Atalhos */}
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="p-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  title={t('app.keyboardShortcuts')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Configurações */}
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

                {/* Toggle painel de anotações */}
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                    isPanelOpen
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={isPanelOpen ? 'Ocultar Painel' : 'Mostrar Painel'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document Area */}
          <main className="flex-1 overflow-y-auto bg-grid">
            {/* Mode Switcher - Floating */}
            <div className="sticky top-3 z-[60] mx-3 md:mx-8 w-fit">
              <ModeSwitcher mode={editorMode} onChange={setEditorMode} onEditMarkdown={handleEnterFullEditMode} onGlobalComment={() => setShowGlobalCommentModal(true)} />
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
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onSelectAnnotation={setSelectedAnnotationId}
                  selectedAnnotationId={selectedAnnotationId}
                  mode={editorMode}
                  onBlockChange={setBlocks}
                />
              )}
            </div>
          </main>

          {/* Annotation Panel */}
          <AnnotationPanel
            isOpen={isPanelOpen}
            blocks={blocks}
            annotations={annotations}
            selectedId={selectedAnnotationId}
            onSelect={handleSelectAnnotation}
            onDelete={handleDeleteAnnotation}
            shareUrl={shareUrl}
          />
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          shareUrl={shareUrl}
          shareUrlSize={shareUrlSize}
          diffOutput={diffOutput}
          annotationCount={annotations.length}

        />

        {/* Global Comment Input Modal */}
        <GlobalCommentInput
          isOpen={showGlobalCommentModal}
          onClose={() => setShowGlobalCommentModal(false)}
          onSubmit={handleAddGlobalComment}
        />

        {/* Help Video Modal */}
        {showHelpVideo && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowHelpVideo(false)}
          >
            <div
              className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl relative"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-video-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 id="help-video-title" className="font-semibold text-sm">Como o Obsidian Note Reviewer Funciona</h3>
                <button
                  onClick={() => setShowHelpVideo(false)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0"
                  title="Como o Obsidian Note Reviewer Funciona"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        )}

        {/* Feedback prompt dialog */}
        {showFeedbackPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Adicione Anotações</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Para solicitar alterações, selecione texto na nota e adicione anotações.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFeedbackPrompt(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
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
                  {submitted === 'approved' ? 'Nota Aprovada' : 'Alterações Solicitadas'}
                </h2>
                <p className="text-muted-foreground">
                  {submitted === 'approved'
                    ? 'A nota será salva no Obsidian.'
                    : 'Claude irá revisar a nota com base nas suas anotações.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Retorne ao <span className="text-foreground font-medium">terminal do Claude Code</span> para continuar.
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Update notification */}

        {/* Full Edit Mode Overlay */}
        {isFullEditMode && (
          <div className="fixed inset-0 z-[100] bg-background flex flex-col">
            {/* Full Edit Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-border/50 bg-card/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveFullEdit}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('app.saveChanges')}
                </button>
              </div>
            </div>

            {/* Full Edit Content */}
            <div className="flex-1 overflow-hidden flex">
              <textarea
                ref={fullEditTextareaRef}
                value={fullEditContent}
                onChange={(e) => setFullEditContent(e.target.value)}
                className="flex-1 w-full h-full p-6 md:p-8 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none border-none"
                placeholder="Digite o conteúdo markdown da sua nota..."
                spellCheck={false}
              />
            </div>

            {/* Full Edit Footer with tips */}
            <div className="h-10 flex items-center justify-between px-4 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{t('app.escToCancel')}</span>
                <span>Ctrl+Enter para salvar</span>
              </div>
              <div>
                Edição markdown direta
              </div>
            </div>
          </div>
        )}

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
                <p className="text-sm font-medium text-foreground">Alterações copiadas!</p>
                <p className="text-xs text-muted-foreground">Cole no Claude Code para processar</p>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />

        {/* Share Dialog - Simple inline implementation */}
        {showShareDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowShareDialog(false)}>
            <div
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Compartilhar Documento
                </h2>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="p-1 text-destructive hover:text-destructive/80"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                Use a opção "Exportar" para gerar um link de compartilhamento temporário.
              </p>

              {/* Info note */}
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-500">
                  O compartilhamento via Supabase será implementado em breve. Por enquanto, use o recurso de Exportar.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowShareDialog(false);
                    setShowExport(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-colors"
                >
                  {t('app.openExport')}
                </button>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
