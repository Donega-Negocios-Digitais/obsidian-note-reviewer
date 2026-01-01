import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Atualizando App.tsx para usar caminho simples...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// 1. Simplify savePath initialization - use notePath directly
const oldInit = `  const [savePath, setSavePath] = useState<string>(() => {
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

const newInit = `  const [savePath, setSavePath] = useState<string>(() => {
    // Use note path directly
    const note = getNotePath();
    return note || '';
  });`;

content = content.replace(oldInit, newInit);

// 2. Remove buildFullPath and getNoteType from imports since we don't need them anymore
const oldImports = `import {
  storage,
  getVaultPath,
  getNotePath,
  setVaultPath,
  setNotePath,
  getNoteType,
  getNoteName
} from '@plannotator/ui/utils/storage';
import { buildFullPath, type TipoNota } from '@plannotator/ui/utils/notePaths';`;

const newImports = `import {
  storage,
  getVaultPath,
  getNotePath,
  setVaultPath,
  setNotePath,
  getNoteType
} from '@plannotator/ui/utils/storage';
import { type TipoNota } from '@plannotator/ui/utils/notePaths';`;

content = content.replace(oldImports, newImports);

// 3. Simplify handleNotePathChange - just use the path directly
const oldHandler = `  const handleNotePathChange = (notePath: string) => {
    const vaultPath = getVaultPath();
    if (vaultPath && notePath) {
      setSavePath(\`\${vaultPath}/\${notePath}\`);
    } else {
      setSavePath('');
    }
  };`;

const newHandler = `  const handleNotePathChange = (notePath: string) => {
    setSavePath(notePath);
  };`;

content = content.replace(oldHandler, newHandler);

// 4. Simplify handleNoteTypeChange - just save the type, no path calculation
const oldTypeHandler = `  const handleNoteTypeChange = (tipo: TipoNota) => {
    const noteName = getNoteName();
    if (noteName) {
      const fullPath = buildFullPath(tipo, noteName);
      setSavePath(fullPath);
    }
  };`;

const newTypeHandler = `  const handleNoteTypeChange = (tipo: TipoNota) => {
    // Just save the type, path comes from handleNotePathChange
  };`;

content = content.replace(oldTypeHandler, newTypeHandler);

// 5. Remove handleNoteNameChange since we don't use it anymore
const removeHandler = `  const handleNoteNameChange = (name: string) => {
    const noteType = getNoteType();
    if (noteType) {
      const fullPath = buildFullPath(noteType as TipoNota, name);
      setSavePath(fullPath);
    }
  };

  `;

content = content.replace(removeHandler, '  ');

// 6. Remove onNoteNameChange from Settings props
const oldSettingsProps = `            <Settings
              onIdentityChange={handleIdentityChange}
              onNoteTypeChange={handleNoteTypeChange}
              onNoteNameChange={handleNoteNameChange}
              onNotePathChange={handleNotePathChange}`;

const newSettingsProps = `            <Settings
              onIdentityChange={handleIdentityChange}
              onNoteTypeChange={handleNoteTypeChange}
              onNotePathChange={handleNotePathChange}`;

content = content.replace(oldSettingsProps, newSettingsProps);

writeFileSync(appPath, content, 'utf8');

console.log('✅ App.tsx atualizado!');
console.log('   Mudanças:');
console.log('   • savePath agora usa getNotePath() diretamente');
console.log('   • handleNotePathChange simplificado');
console.log('   • handleNoteTypeChange simplificado');
console.log('   • handleNoteNameChange removido');
console.log('   • Imports limpos');
console.log();
