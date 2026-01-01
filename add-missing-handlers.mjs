import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Adicionando handlers faltantes em App.tsx...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Find handleIdentityChange and add the missing handlers after it
const searchPattern = `  const handleIdentityChange = (oldIdentity: string, newIdentity: string) => {
    setAnnotations(prev => prev.map(ann =>
      ann.author === oldIdentity ? { ...ann, author: newIdentity } : ann
    ));
  };`;

const replacement = `  const handleIdentityChange = (oldIdentity: string, newIdentity: string) => {
    setAnnotations(prev => prev.map(ann =>
      ann.author === oldIdentity ? { ...ann, author: newIdentity } : ann
    ));
  };

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

if (content.includes(searchPattern)) {
  content = content.replace(searchPattern, replacement);
  writeFileSync(appPath, content, 'utf8');
  console.log('✅ Handlers adicionados com sucesso!');
  console.log('   • handleNoteTypeChange');
  console.log('   • handleNoteNameChange');
} else {
  console.log('❌ Padrão não encontrado');
  console.log('   Tentando abordagem alternativa...');

  // Try simpler pattern
  const simpler = `  };


  const reconstructMarkdownFromBlocks`;

  const insert = `  };

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
  };


  const reconstructMarkdownFromBlocks`;

  if (content.includes(simpler)) {
    content = content.replace(simpler, insert);
    writeFileSync(appPath, content, 'utf8');
    console.log('✅ Handlers adicionados (abordagem alternativa)!');
  } else {
    console.log('❌ Não foi possível adicionar automaticamente');
  }
}

console.log();
