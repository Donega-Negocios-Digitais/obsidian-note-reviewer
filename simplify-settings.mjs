import { writeFileSync } from 'fs';

console.log('🔧 Simplificando Settings.tsx...\n');

const newSettings = `import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getIdentity, regenerateIdentity } from '../utils/identity';
import {
  getNoteType,
  setNoteType as saveNoteType,
  getNotePath,
  setNotePath as saveNotePath
} from '../utils/storage';
import {
  getNoteTypesByCategory,
  type TipoNota
} from '../utils/notePaths';

interface SettingsProps {
  onIdentityChange?: (oldIdentity: string, newIdentity: string) => void;
  onNoteTypeChange?: (tipo: TipoNota) => void;
  onNoteNameChange?: (name: string) => void;
  onNotePathChange?: (path: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onIdentityChange,
  onNoteTypeChange,
  onNotePathChange
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [identity, setIdentity] = useState('');
  const [noteType, setNoteType] = useState<TipoNota>('video_youtube');
  const [notePath, setNotePath] = useState('');

  // Load saved configuration on dialog open
  useEffect(() => {
    if (showDialog) {
      setIdentity(getIdentity());

      const savedType = getNoteType();
      if (savedType) setNoteType(savedType as TipoNota);

      const savedPath = getNotePath();
      if (savedPath) setNotePath(savedPath);
    }
  }, [showDialog]);

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
  };

  const handleNotePathChange = (path: string) => {
    setNotePath(path);
    saveNotePath(path);
    onNotePathChange?.(path);
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
                  Escolha o tipo de conteúdo que está revisando
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

              {/* Seção 2: Caminho/URL da Nota */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-primary">Caminho da Nota</h4>
                <div className="text-xs text-muted-foreground mb-3">
                  Cole a URL obsidian:// ou caminho completo da nota
                </div>
                <input
                  type="text"
                  value={notePath}
                  onChange={(e) => handleNotePathChange(e.target.value)}
                  placeholder="obsidian://vault/MyVault/path/to/note.md ou C:/path/to/note.md"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-xs border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  Exemplos:
                  <ul className="mt-1 ml-4 space-y-0.5">
                    <li>• obsidian://open?vault=MyVault&file=Atlas/Conteudos/nota.md</li>
                    <li>• C:/Users/Alex/Documents/ObsidianVault/Atlas/nota.md</li>
                  </ul>
                </div>
              </section>

              <div className="border-t border-border" />

              {/* Seção 3: Identidade */}
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

console.log('✅ Settings.tsx simplificado!');
console.log('   Nova estrutura:');
console.log('   • Tipo de Nota (dropdown com categorias)');
console.log('   • Caminho da Nota (input para URL/path)');
console.log('   • Identidade do Revisor');
console.log();
