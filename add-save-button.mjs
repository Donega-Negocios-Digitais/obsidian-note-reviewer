import { readFileSync, writeFileSync } from 'fs';

console.log('💾 Adicionando botão "Salvar no Obsidian"...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Botão a ser adicionado (antes do ModeToggle)
const saveButton = `
            {/* Botão Salvar no Obsidian */}
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
            </button>

`;

// Encontrar a linha "<ModeToggle />" e inserir antes
const modeToggleIndex = content.indexOf('<ModeToggle />');

if (modeToggleIndex !== -1) {
  // Inserir antes do ModeToggle
  content = content.slice(0, modeToggleIndex) + saveButton + '            ' + content.slice(modeToggleIndex);

  writeFileSync(appPath, content, 'utf8');
  console.log('✅ Botão "Salvar no Obsidian" adicionado com sucesso!');
  console.log('   Localização: Antes do ModeToggle no header\n');
} else {
  console.log('❌ ModeToggle não encontrado');
  process.exit(1);
}
