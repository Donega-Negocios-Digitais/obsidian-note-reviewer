import { writeFileSync } from 'fs';

console.log('🔧 Redesenhando Settings.tsx com sistema de configurações avançadas...\n');

const newSettings = `import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getIdentity, regenerateIdentity } from '../utils/identity';
import {
  getNoteType,
  setNoteType as saveNoteType,
  getNoteName,
  setNoteName as saveNoteName,
  getNoteConfig,
  saveNoteConfig
} from '../utils/storage';
import {
  getNoteTypesByCategory,
  buildFullPath,
  type TipoNota
} from '../utils/notePaths';

interface SettingsProps {
  onIdentityChange?: (oldIdentity: string, newIdentity: string) => void;
  onNoteTypeChange?: (tipo: TipoNota) => void;
  onNoteNameChange?: (name: string) => void;
  onNotePathChange?: (path: string) => void;
}

interface ValidationResult {
  templateExists: boolean;
  templatePath: string;
  dirExists: boolean;
  fullPath: string;
  canSave: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  onIdentityChange,
  onNoteTypeChange,
  onNoteNameChange,
  onNotePathChange
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [identity, setIdentity] = useState('');

  // Note configuration states
  const [noteType, setNoteType] = useState<TipoNota>('video_youtube');
  const [noteName, setNoteName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load saved configuration on dialog open
  useEffect(() => {
    if (showDialog) {
      setIdentity(getIdentity());

      const savedConfig = getNoteConfig();
      if (savedConfig) {
        setNoteType(savedConfig.tipo as TipoNota);
        setNoteName(savedConfig.noteName);
      } else {
        // Load individual values if no config saved
        const tipo = getNoteType();
        if (tipo) setNoteType(tipo as TipoNota);
        setNoteName(getNoteName());
      }
    }
  }, [showDialog]);

  // Auto-validate when type or name changes
  useEffect(() => {
    if (showDialog && noteName.trim()) {
      validatePaths();
    }
  }, [noteType, noteName, showDialog]);

  const handleRegenerateIdentity = () => {
    const oldIdentity = identity;
    const newIdentity = regenerateIdentity();
    setIdentity(newIdentity);
    onIdentityChange?.(oldIdentity, newIdentity);
  };

  const handleNoteTypeChange = (tipo: TipoNota) => {
    setNoteType(tipo);
    saveNoteType(tipo);
    onNoteTypeChange?.(tipo);

    // Save complete config
    saveNoteConfig({
      tipo,
      noteName
    });

    // Clear YouTube URL if switching away from video
    if (tipo !== 'video_youtube') {
      setYoutubeUrl('');
    }
  };

  const handleNoteNameChange = (name: string) => {
    setNoteName(name);
    saveNoteName(name);
    onNoteNameChange?.(name);

    // Update path callback
    if (name.trim()) {
      const fullPath = buildFullPath(noteType, name);
      onNotePathChange?.(fullPath);
    }

    // Save complete config
    saveNoteConfig({
      tipo: noteType,
      noteName: name
    });
  };

  const validatePaths = async () => {
    if (!noteName.trim()) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: noteType,
          filename: noteName
        })
      });

      const result = await response.json();
      if (result.ok) {
        setValidation(result.validation);
      }
    } catch (error) {
      console.error('Erro ao validar caminhos:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExtractYouTube = async () => {
    if (!youtubeUrl.trim()) {
      setExtractError('Digite uma URL do YouTube');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'video_youtube',
          url: youtubeUrl
        })
      });

      const result = await response.json();

      if (!result.ok) {
        setExtractError(result.error || 'Erro ao extrair dados do YouTube');
        return;
      }

      // Auto-fill note name from video title
      if (result.data?.title && !noteName) {
        const cleanTitle = result.data.title
          .replace(/[^a-zA-Z0-9\\s-]/g, '')
          .replace(/\\s+/g, '-')
          .toLowerCase();
        handleNoteNameChange(cleanTitle);
      }

      // TODO: Could also populate frontmatter with extracted data
      console.log('Dados extraídos:', result.data);

    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Erro ao extrair');
    } finally {
      setIsExtracting(false);
    }
  };

  const noteTypes = getNoteTypesByCategory();

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors"
        title="Configurações"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Configurações</span>
      </button>

      {showDialog && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDialog(false);
          }}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Configurações</h3>
              <button
                onClick={() => setShowDialog(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">

              {/* Seção 1: Tipo de Nota */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-primary">Tipo de Nota</h4>
                <div className="text-xs text-muted-foreground mb-3">
                  Define template e caminho de salvamento
                </div>
                <select
                  value={noteType}
                  onChange={(e) => handleNoteTypeChange(e.target.value as TipoNota)}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-xs border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <optgroup label="Conteúdo de Terceiros">
                    {noteTypes.terceiros.map(({ tipo, emoji, label }) => (
                      <option key={tipo} value={tipo}>
                        {emoji} {label}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Notas Atômicas">
                    {noteTypes.atomica.map(({ tipo, emoji, label }) => (
                      <option key={tipo} value={tipo}>
                        {emoji} {label}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Notas Organizacionais">
                    {noteTypes.organizacional.map(({ tipo, emoji, label }) => (
                      <option key={tipo} value={tipo}>
                        {emoji} {label}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Conteúdo Próprio">
                    {noteTypes.alex.map(({ tipo, emoji, label }) => (
                      <option key={tipo} value={tipo}>
                        {emoji} {label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </section>

              <div className="border-t border-border" />

              {/* Seção 2: Nome e Caminho */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-primary">Nome e Localização</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Nome da Nota
                    </label>
                    <input
                      type="text"
                      value={noteName}
                      onChange={(e) => handleNoteNameChange(e.target.value)}
                      placeholder="nome-da-nota"
                      className="w-full px-3 py-2 bg-muted rounded-lg text-xs border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {noteName.trim() && (
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Caminho Final
                      </label>
                      <div className="px-3 py-2 bg-muted/50 rounded-lg text-xs font-mono text-muted-foreground break-all">
                        {buildFullPath(noteType, noteName)}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {noteType === 'video_youtube' && (
                <>
                  <div className="border-t border-border" />

                  {/* Seção 3: Extração YouTube */}
                  <section>
                    <h4 className="text-sm font-semibold mb-3 text-primary">Extrair de YouTube</h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={isExtracting}
                        />
                        <button
                          onClick={handleExtractYouTube}
                          disabled={isExtracting || !youtubeUrl.trim()}
                          className={\`px-3 py-2 rounded-lg text-xs font-medium transition-colors \${
                            isExtracting || !youtubeUrl.trim()
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }\`}
                        >
                          {isExtracting ? 'Extraindo...' : 'Extrair'}
                        </button>
                      </div>
                      {extractError && (
                        <div className="text-xs text-red-500">
                          {extractError}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {validation && noteName.trim() && (
                <>
                  <div className="border-t border-border" />

                  {/* Seção 4: Status de Validação */}
                  <section>
                    <h4 className="text-sm font-semibold mb-3 text-primary">Status</h4>
                    <div className="space-y-1.5">
                      <div className={\`flex items-center gap-2 text-xs \${validation.templateExists ? 'text-green-500' : 'text-red-500'}\`}>
                        <span>{validation.templateExists ? '✓' : '✗'}</span>
                        <span>
                          {validation.templateExists
                            ? 'Template encontrado'
                            : 'Template não encontrado'}
                        </span>
                      </div>

                      <div className={\`flex items-center gap-2 text-xs \${validation.dirExists ? 'text-green-500' : 'text-yellow-500'}\`}>
                        <span>{validation.dirExists ? '✓' : '⚠'}</span>
                        <span>
                          {validation.dirExists
                            ? 'Pasta existe'
                            : 'Pasta será criada'}
                        </span>
                      </div>

                      <div className={\`flex items-center gap-2 text-xs \${validation.canSave ? 'text-green-500' : 'text-red-500'}\`}>
                        <span>{validation.canSave ? '✓' : '✗'}</span>
                        <span>
                          {validation.canSave
                            ? 'Pronto para salvar'
                            : 'Não pode salvar (verifique template)'}
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              )}

              <div className="border-t border-border" />

              {/* Seção 5: Identidade */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-primary">Identidade do Revisor</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Seu ID único
                    </label>
                    <div className="px-3 py-2 bg-muted rounded-lg text-xs font-mono text-muted-foreground break-all">
                      {identity}
                    </div>
                  </div>
                  <button
                    onClick={handleRegenerateIdentity}
                    className="w-full px-3 py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    Gerar Nova Identidade
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Esta identidade será incluída nas anotações que você criar.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
`;

const settingsPath = 'packages/ui/components/Settings.tsx';
writeFileSync(settingsPath, newSettings, 'utf8');

console.log('✅ Settings.tsx redesenhado com sucesso!');
console.log('   Novas funcionalidades:');
console.log('   • Dropdown de tipo de nota (organizado por categoria)');
console.log('   • Campo nome da nota com persistência');
console.log('   • Preview do caminho final');
console.log('   • Extração YouTube (condicional)');
console.log('   • Validação em tempo real');
console.log('   • Seção de identidade mantida');
console.log();
