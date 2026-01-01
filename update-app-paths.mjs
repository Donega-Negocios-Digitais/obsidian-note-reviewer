import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Atualizando App.tsx com nova lógica de caminhos...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// 1. Add imports for new path utilities
const oldImports = `import { storage, getVaultPath, getNotePath, setVaultPath, setNotePath } from '@plannotator/ui/utils/storage';`;
const newImports = `import {
  storage,
  getVaultPath,
  getNotePath,
  setVaultPath,
  setNotePath,
  getNoteType,
  getNoteName
} from '@plannotator/ui/utils/storage';
import { buildFullPath, type TipoNota } from '@plannotator/ui/utils/notePaths';`;

content = content.replace(oldImports, newImports);

// 2. Update savePath initialization to use buildFullPath
const oldSavePathInit = `  const [savePath, setSavePath] = useState<string>(() => {
    const vault = getVaultPath();
    const note = getNotePath();
    return vault && note ? \`\${vault}/\${note}\` : '';
  });`;

const newSavePathInit = `  const [savePath, setSavePath] = useState<string>(() => {
    // Try to build path from note type + name first
    const noteType = getNoteType();
    const noteName = getNoteName();

    if (noteType && noteName) {
      return buildFullPath(noteType as TipoNota, noteName);
    }

    // Fallback to vault + note path (legacy)
    const vault = getVaultPath();
    const note = getNotePath();
    return vault && note ? \`\${vault}/\${note}\` : '';
  });`;

content = content.replace(oldSavePathInit, newSavePathInit);

// 3. Add handler for note type change (after handleNotePathChange)
const insertAfter = `  const handleIdentityChange = (oldIdentity: string, newIdentity: string) => {
    setAnnotations(prev => prev.map(ann =>
      ann.author === oldIdentity ? { ...ann, author: newIdentity } : ann
    ));
  };`;

const newHandlers = `
  const handleNoteTypeChange = (tipo: TipoNota) => {
    // Recalculate save path with new type
    const noteName = getNoteName();
    if (noteName) {
      const fullPath = buildFullPath(tipo, noteName);
      setSavePath(fullPath);
    }
  };

  const handleNoteNameChange = (name: string) => {
    // Recalculate save path with new name
    const noteType = getNoteType();
    if (noteType) {
      const fullPath = buildFullPath(noteType as TipoNota, name);
      setSavePath(fullPath);
    }
  };`;

content = content.replace(insertAfter, insertAfter + newHandlers);

// 4. Update Settings component to pass new handlers
const oldSettings = `            <Settings
              onIdentityChange={handleIdentityChange}
              onVaultPathChange={handleVaultPathChange}
              onNotePathChange={handleNotePathChange}`;

const newSettings = `            <Settings
              onIdentityChange={handleIdentityChange}
              onNoteTypeChange={handleNoteTypeChange}
              onNoteNameChange={handleNoteNameChange}
              onNotePathChange={handleNotePathChange}`;

content = content.replace(oldSettings, newSettings);

writeFileSync(appPath, content, 'utf8');

console.log('✅ App.tsx atualizado com sucesso!');
console.log('   Mudanças aplicadas:');
console.log('   • Importação de buildFullPath e TipoNota');
console.log('   • Importação de getNoteType e getNoteName');
console.log('   • savePath agora usa buildFullPath()');
console.log('   • Handler handleNoteTypeChange adicionado');
console.log('   • Handler handleNoteNameChange adicionado');
console.log('   • Settings recebe onNoteTypeChange e onNoteNameChange');
console.log();
