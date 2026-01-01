import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Adicionando estados faltantes...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Estados que precisam ser adicionados
const newStates = `  const [savePath, setSavePath] = useState<string>(() => {
    const vault = getVaultPath();
    const note = getNotePath();
    return vault && note ? \`\${vault}/\${note}\` : '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
`;

// Procurar por "const [annotations, setAnnotations]" e adicionar depois
const annotationsIndex = content.indexOf('const [annotations, setAnnotations]');

if (annotationsIndex !== -1) {
  // Encontrar o final dessa linha
  const lineEnd = content.indexOf('\n', annotationsIndex);

  content = content.slice(0, lineEnd + 1) + newStates + content.slice(lineEnd + 1);

  writeFileSync(appPath, content, 'utf8');
  console.log('✅ Estados adicionados: savePath, isSaving, saveError');
} else {
  console.log('❌ Linha de annotations não encontrada');
  process.exit(1);
}
