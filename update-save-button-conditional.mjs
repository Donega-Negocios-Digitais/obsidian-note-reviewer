import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Atualizando botão Salvar com lógica condicional...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Find and replace the save button
const oldButton = `            {/* Botão Salvar no Obsidian */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !savePath}
              className={\`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                \${isSaving || !savePath
                  ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
                }
              \`}
              title={!savePath ? 'Configure o caminho nas configurações' : 'Salvar nota no Obsidian'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden md:inline">{isSaving ? 'Salvando...' : 'Salvar no Obsidian'}</span>
            </button>`;

const newButton = `            {/* Botão Salvar/Alterações - Condicional */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !savePath}
              className={\`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                \${isSaving || !savePath
                  ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                  : annotations.length > 0
                    ? 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border border-orange-500/40'
                    : 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 border border-purple-500/40'
                }
              \`}
              title={
                !savePath
                  ? 'Configure o caminho nas configurações'
                  : annotations.length > 0
                    ? 'Fazer alterações no Claude Code'
                    : 'Salvar nota no Obsidian'
              }
            >
              {annotations.length > 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden md:inline">{isSaving ? 'Processando...' : 'Fazer Alterações'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span className="hidden md:inline">{isSaving ? 'Salvando...' : 'Salvar no Obsidian'}</span>
                </>
              )}
            </button>`;

content = content.replace(oldButton, newButton);

writeFileSync(appPath, content, 'utf8');

console.log('✅ Botão atualizado com lógica condicional!');
console.log('   Comportamento:');
console.log('   • COM anotações → 🟠 LARANJA "Fazer Alterações"');
console.log('   • SEM anotações → 🟣 ROXO "Salvar no Obsidian"');
console.log();
