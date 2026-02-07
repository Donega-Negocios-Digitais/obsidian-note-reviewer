/**
 * Shared Document Page
 *
 * Guest-accessible page for viewing shared documents.
 * No authentication required - visitors can view documents with signup prompts.
 *
 * Per CONTEXT.md: "Visualizacao completa (veem anotacoes, autores, cursores)"
 * Per CONTEXT.md: "Presenca de convidados: Presenca completa (convidados veem cursores e lista de usuarios, e vice-versa)"
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuestBanner } from '../components/GuestBanner';
import { CollaborationRoom } from '../components/collaboration/RoomProvider';
import { PresenceList } from '../components/collaboration/PresenceList';
import { LiveCursors } from '../components/collaboration/LiveCursors';
import { getDocumentBySlug } from '@/lib/supabase/sharing';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    name: string;
    avatar?: string;
  };
}

/**
 * Public page for viewing shared documents without authentication
 */
export function SharedDocument() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    // Fetch document by slug from Supabase
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use actual Supabase fetch with NanoID slug
        const sharedData = await getDocumentBySlug(slug);

        setDocument({
          id: sharedData.document_id,
          title: sharedData.document?.title || 'Documento Sem Título',
          content: sharedData.document?.content || '',
          createdAt: sharedData.created_at,
          author: {
            name: 'Compartilhado',
          },
        });
      } catch (err) {
        console.error('Failed to fetch shared document:', err);
        setError('Documento não encontrado ou link expirou');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando documento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Documento Não Encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Este link pode ter expirado ou o documento não existe.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <CollaborationRoom documentId={document.id} initialPresence={{ name: 'Convidado', color: '#6366f1' }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Guest Banner - always shown for anonymous users */}
        <GuestBanner />

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {document.title}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compartilhado por {document.author?.name || 'alguém'}
                </p>
              </div>
            </div>

            {/* Presence list - per CONTEXT.md: guests see full presence */}
            <PresenceList />

            {/* Share button */}
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                // Could add toast notification here
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Copiar link"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Document Content with Live Cursors */}
        <main className="max-w-7xl mx-auto px-4 py-8 relative">
          {/* Live cursors overlay - per CONTEXT.md: guests see cursors */}
          <LiveCursors />

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap">{document.content}</pre>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Compartilhado via <span className="font-medium">Obsidian Note Reviewer</span>
            </p>
          </div>
        </footer>
      </div>
    </CollaborationRoom>
  );
}

export default SharedDocument;
