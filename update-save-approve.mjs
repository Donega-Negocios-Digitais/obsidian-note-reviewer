import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Modificando botão "Salvar no Obsidian" para salvar + aprovar...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Update handleSaveToVault to also approve
const oldHandler = `  const handleSaveToVault = async () => {
    if (!savePath.trim()) {
      setSaveError('Configure o caminho do arquivo nas configurações');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const content = reconstructMarkdownFromBlocks(blocks);
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          path: savePath
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Erro ao salvar');
      }

      console.log('Nota salva com sucesso:', savePath);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };`;

const newHandler = `  const handleSaveToVault = async () => {
    if (!savePath.trim()) {
      setSaveError('Configure o caminho do arquivo nas configurações');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const content = reconstructMarkdownFromBlocks(blocks);
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          path: savePath
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Erro ao salvar');
      }

      console.log('✅ Nota salva com sucesso:', savePath);

      // Se estiver em API mode, também aprovar automaticamente
      if (isApiMode) {
        console.log('🎯 Aprovando automaticamente...');
        try {
          await fetch('/api/approve', { method: 'POST' });
          setSubmitted('approved');
          console.log('✅ Aprovado com sucesso!');
        } catch (approveError) {
          console.error('⚠️ Erro ao aprovar:', approveError);
          // Não falha se aprovação der erro - nota já foi salva
        }
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };`;

content = content.replace(oldHandler, newHandler);

writeFileSync(appPath, content, 'utf8');

console.log('✅ Botão "Salvar no Obsidian" atualizado!');
console.log('   Novo comportamento:');
console.log('   1. Salva a nota no caminho configurado');
console.log('   2. Se estiver em API mode, aprova automaticamente');
console.log('   3. Claude Code recebe aprovação e pode continuar');
console.log();
