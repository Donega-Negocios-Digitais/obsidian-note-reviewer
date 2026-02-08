/**
 * Collaboration Preview Page
 * 
 * UI/UX preview of collaboration features without requiring:
 * - Supabase connection
 * - Liveblocks connection
 * - Real-time backend
 * 
 * Use this to validate visual design, animations, and layout.
 * Access at: http://localhost:3001/preview/collaboration
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestBanner } from '../../components/GuestBanner';

// ============================================================================
// MOCK DATA - CONTEÚDO REALISTA DE NOTA
// ============================================================================

interface MockUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  textColor: string;
  isTyping: boolean;
  isCurrentUser: boolean;
}

interface MockCursor {
  userId: string;
  x: number;
  y: number;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'user-1',
    name: 'Alex Silva',
    initials: 'AS',
    color: '#6366f1',
    textColor: '#ffffff',
    isTyping: true,
    isCurrentUser: true,
  },
  {
    id: 'user-2',
    name: 'Maria Souza',
    initials: 'MS',
    color: '#10b981',
    textColor: '#ffffff',
    isTyping: false,
    isCurrentUser: false,
  },
  {
    id: 'user-3',
    name: 'João Pereira',
    initials: 'JP',
    color: '#f59e0b',
    textColor: '#ffffff',
    isTyping: false,
    isCurrentUser: false,
  },
  {
    id: 'user-4',
    name: 'Ana Costa',
    initials: 'AC',
    color: '#ec4899',
    textColor: '#ffffff',
    isTyping: true,
    isCurrentUser: false,
  },
  {
    id: 'user-5',
    name: 'Carlos Lima',
    initials: 'CL',
    color: '#8b5cf6',
    textColor: '#ffffff',
    isTyping: false,
    isCurrentUser: false,
  },
];

// Conteúdo markdown completo e realista
const MOCK_DOCUMENT = {
  id: 'doc-001',
  title: 'Plano de Arquitetura - Sistema de Review v2',
  modified: true,
  content: `# Plano de Arquitetura - Sistema de Review v2

## Visão Geral

Este documento descreve a arquitetura proposta para o novo sistema de review de código, com foco em **colaboração em tempo real** e integração com ferramentas existentes.

## Objetivos

1. 🚀 **Performance**: Reduzir tempo de review em 40%
2. 🤝 **Colaboração**: Múltiplos revisores simultâneos
3. 🔗 **Integração**: Conexão nativa com GitHub/GitLab
4. 📊 **Métricas**: Dashboard de produtividade

## Stack Tecnológico

\`\`\`typescript
// Exemplo de configuração
const config = {
  realtime: 'Liveblocks',
  auth: 'Supabase',
  frontend: 'React + Vite',
  styling: 'Tailwind CSS',
  deployment: 'Vercel'
};
\`\`\`

## Componentes Principais

### 1. Editor de Código

- Syntax highlighting para 15+ linguagens
- Comentários inline em threads
- Navegação por symbols

### 2. Sistema de Presença

| Feature | Status | Responsável |
|---------|--------|-------------|
| Cursores em tempo real | ✅ Done | Alex |
| Avatares na viewport | ✅ Done | Maria |
| Indicador "digitando..." | 🚧 WIP | João |
| Seleção compartilhada | 📋 Todo | Ana |

### 3. Notificações

> 💡 **Importante**: As notificações devem ser opt-in para evitar fadiga.

## Fluxo de Dados

\`\`\`
[Editor] → [Liveblocks] → [Supabase] → [Clientes]
   ↓
[Webhook] → [Slack/Discord]
\`\`\`

## Checklist de Implementação

- [x] Setup do projeto
- [x] Configuração do Liveblocks
- [x] Componentes de UI base
- [x] Sistema de autenticação
- [ ] Testes E2E
- [ ] Documentação
- [ ] Deploy em produção

## Notas de Reunião

Reunião do dia 07/02/2026:

> Alex: Precisamos garantir que o sistema funcione offline também.
> 
> Maria: Concordo, podemos usar um service worker para cache.
> 
> João: Vou pesquisar sobre CRDTs para merge de conflitos.

## Próximos Passos

1. Finalizar integração com GitHub
2. Implementar modo offline
3. Criar painel de admin
4. **Prioridade alta**: Resolver conflitos de merge

---

*Documento criado em: 2026-02-07*
*Última atualização: 2026-02-08 às 14:30*`,
};

// Anotações mock
const MOCK_ANNOTATIONS = [
  {
    id: 'anno-1',
    text: 'Podemos usar Yjs ao invés de Liveblocks?',
    author: 'Maria Souza',
    status: 'open',
    timestamp: '2 horas atrás',
    replies: 2,
  },
  {
    id: 'anno-2',
    text: 'Adicionar exemplo de teste E2E aqui',
    author: 'João Pereira',
    status: 'in-progress',
    timestamp: '1 hora atrás',
    replies: 0,
  },
  {
    id: 'anno-3',
    text: 'Lembrete: verificar compatibilidade com Safari',
    author: 'Ana Costa',
    status: 'resolved',
    timestamp: '30 min atrás',
    replies: 1,
  },
];

// ============================================================================
// MOCK COMPONENTS
// ============================================================================

function UserAvatar({ user, delay = 0 }: { user: MockUser; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="relative group transition-all duration-300 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-8px)',
      }}
      title={user.isCurrentUser ? `${user.name} (você)` : user.name}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover:scale-110"
        style={{ backgroundColor: user.color, color: user.textColor }}
      >
        <span>{user.initials}</span>
      </div>

      {user.isTyping && (
        <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-600 dark:text-gray-400 whitespace-nowrap bg-white/90 dark:bg-gray-800/90 px-1 rounded shadow-sm animate-pulse">
          digitando...
        </span>
      )}

      {user.isCurrentUser && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" title="Você">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
          {user.name}
        </span>
      </div>
    </div>
  );
}

function MockPresenceList() {
  const [users, setUsers] = useState(MOCK_USERS);
  const maxVisible = 5;
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  useEffect(() => {
    const timer = setTimeout(() => {
      const newUser: MockUser = {
        id: 'user-6',
        name: 'Novo Usuário',
        initials: 'NU',
        color: '#06b6d4',
        textColor: '#ffffff',
        isTyping: false,
        isCurrentUser: false,
      };
      setUsers(prev => [...prev, newUser]);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div key={user.id} className="relative z-10" style={{ zIndex: visibleUsers.length - index }}>
            <UserAvatar user={user} delay={index * 50} />
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-help z-0"
            title={`+${remainingCount} outros visualizando`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      <span className="text-sm text-gray-600 dark:text-gray-400">
        {users.length} {users.length === 1 ? 'pessoa' : 'pessoas'} visualizando
      </span>
    </div>
  );
}

function Cursor({ x, y, color, name, isTyping }: { x: number; y: number; color: string; name: string; isTyping?: boolean }) {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-100 ease-out z-50"
      style={{ left: x, top: y }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-15deg)' }}>
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.44 0 .66-.53.35-.85L6.35 2.85a.5.5 0 00-.85.35z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
        {isTyping && <span className="ml-1 animate-pulse">...</span>}
      </div>
    </div>
  );
}

function MockLiveCursors() {
  const [cursors, setCursors] = useState<MockCursor[]>([
    { userId: 'user-2', x: 300, y: 200 },
    { userId: 'user-3', x: 500, y: 350 },
    { userId: 'user-4', x: 700, y: 280 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => prev.map(cursor => ({
        ...cursor,
        x: Math.max(100, Math.min(900, cursor.x + (Math.random() - 0.5) * 150)),
        y: Math.max(100, Math.min(600, cursor.y + (Math.random() - 0.5) * 80)),
      })));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const getUserById = (id: string) => MOCK_USERS.find(u => u.id === id);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {cursors.map((cursor) => {
        const user = getUserById(cursor.userId);
        if (!user) return null;
        return (
          <Cursor
            key={cursor.userId}
            x={cursor.x}
            y={cursor.y}
            color={user.color}
            name={user.name}
            isTyping={user.isTyping}
          />
        );
      })}
    </div>
  );
}

// Componente de Tabs Mock
function MockTabs() {
  const tabs = [
    { id: '1', title: 'Plano de Arquitetura', active: true },
    { id: '2', title: 'API Documentation.md', active: false },
    { id: '3', title: 'TODO.txt', active: false },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer
            transition-colors whitespace-nowrap
            ${tab.active 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <span>📄</span>
          <span>{tab.title}</span>
          {tab.active && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
        </div>
      ))}
    </div>
  );
}

// Componente de Anotações Mock
function MockAnnotationsPanel() {
  const [showResolved, setShowResolved] = useState(true);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Anotações ({MOCK_ANNOTATIONS.length})
        </h2>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showResolved ? 'Ocultar resolvidas' : 'Mostrar resolvidas'}
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_ANNOTATIONS.map((anno) => (
          <div
            key={anno.id}
            className={`
              p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md
              ${anno.status === 'resolved' && !showResolved ? 'hidden' : ''}
              ${anno.status === 'open' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
              ${anno.status === 'in-progress' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : ''}
              ${anno.status === 'resolved' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 opacity-60' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${anno.status === 'open' ? 'bg-yellow-500 text-white' : ''}
                ${anno.status === 'in-progress' ? 'bg-blue-500 text-white' : ''}
                ${anno.status === 'resolved' ? 'bg-green-500 text-white' : ''}
              `}>
                {anno.status === 'open' && '○'}
                {anno.status === 'in-progress' && '◐'}
                {anno.status === 'resolved' && '✓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {anno.text}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{anno.author}</span>
                  <span>•</span>
                  <span>{anno.timestamp}</span>
                  {anno.replies > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400">{anno.replies} respostas</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
        + Nova Anotação
      </button>
    </div>
  );
}

// ============================================================================
// MAIN PREVIEW PAGE
// ============================================================================

export function CollaborationPreview() {
  const navigate = useNavigate();
  const [showJoinAnimation, setShowJoinAnimation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowJoinAnimation(true);
      setTimeout(() => setShowJoinAnimation(false), 3000);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Guest Banner */}
      <GuestBanner />

      {/* Tabs */}
      <MockTabs />

      {/* Main Content Area - 3 Column Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_380px_300px]">
          
          {/* Column 1: Document Content */}
          <div className="overflow-auto h-full">
            <div className="max-w-4xl mx-auto p-6 md:p-8">
              {/* Document Header */}
              <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {MOCK_DOCUMENT.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Editado há 2 minutos
                      </span>
                      {MOCK_DOCUMENT.modified && (
                        <span className="text-blue-600 dark:text-blue-400">
                          • Modificado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MockPresenceList />
                    <button
                      onClick={handleCopyLink}
                      className={`
                        p-2 rounded-lg transition-all flex items-center gap-2
                        ${copied 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      title="Copiar link"
                    >
                      {copied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">Copiado!</span>
                        </>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Cursors Overlay */}
              <div className="relative">
                <MockLiveCursors />

                {/* Document Content - Markdown Rendered */}
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {MOCK_DOCUMENT.content.split('\n').map((line, i) => {
                      // Headers
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{line.slice(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-3">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">{line.slice(4)}</h3>;
                      }
                      // Code blocks
                      if (line.startsWith('```')) {
                        return <div key={i} className="my-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto"><code className="text-sm">{line}</code></div>;
                      }
                      // Lists
                      if (line.match(/^\d+\./)) {
                        return <div key={i} className="ml-4 my-1">{line}</div>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        const isTask = line.includes('[ ]') || line.includes('[x]');
                        return (
                          <div key={i} className="ml-4 my-1 flex items-start gap-2">
                            {isTask ? (
                              <input type="checkbox" checked={line.includes('[x]')} readOnly className="mt-1" />
                            ) : (
                              <span>•</span>
                            )}
                            <span>{line.slice(isTask ? line.indexOf(']') + 2 : 2)}</span>
                          </div>
                        );
                      }
                      // Blockquote
                      if (line.startsWith('> ')) {
                        return (
                          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
                            {line.slice(2)}
                          </blockquote>
                        );
                      }
                      // Table
                      if (line.includes('|')) {
                        return <div key={i} className="font-mono text-xs bg-gray-50 dark:bg-gray-800/50 p-2 my-2 rounded">{line}</div>;
                      }
                      // Empty line
                      if (!line.trim()) {
                        return <div key={i} className="h-4" />;
                      }
                      // Bold/italic inline
                      const formatted = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">$1</code>');
                      
                      return <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </div>
                </div>

                {/* Preview Info Banner */}
                <div className="mt-12 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎨</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Preview de Colaboração</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Esta é uma simulação visual. Os cursores e avatares são mockados para demonstração do UI.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => navigate('/editor')}
                          className="text-sm px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Ir para Editor Real
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="text-sm px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Recarregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Annotations Panel */}
          <div className="hidden lg:block overflow-auto h-full p-6 border-l border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <MockAnnotationsPanel />
          </div>

          {/* Column 3: References Panel (XL only) */}
          <div className="hidden xl:block overflow-auto h-full p-4 border-l border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Referências
              </h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-medium text-gray-800 dark:text-gray-200">README.md</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 referências</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-medium text-gray-800 dark:text-gray-200">CHANGELOG.md</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 referência</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-medium text-gray-800 dark:text-gray-200">CONTRIBUTING.md</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 referências</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New User Notification */}
      {showJoinAnimation && (
        <div className="fixed top-24 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-bounce z-50 flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <div>
            <p className="font-medium">Novo usuário entrou!</p>
            <p className="text-xs text-green-100">Você agora está colaborando com 6 pessoas</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollaborationPreview;
