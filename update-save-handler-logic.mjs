import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Atualizando lógica do handleSaveToVault...\n');

const appPath = 'packages/editor/App.tsx';
let content = readFileSync(appPath, 'utf8');

// Find and replace handleSaveToVault
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

const newHandler = `  const handleSaveToVault = async () => {
    if (!savePath.trim()) {
      setSaveError('Configure o caminho nas configurações');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // CASO 1: TEM ANOTAÇÕES → Fazer Alterações (deny com feedback)
      if (annotations.length > 0) {
        console.log('🟠 Solicitando alterações com', annotations.length, 'anotações');

        if (isApiMode) {
          // Envia feedback para Claude Code
          await fetch('/api/deny', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: diffOutput })
          });
          setSubmitted('denied');
          console.log('✅ Alterações solicitadas ao Claude Code!');
        }
        return;
      }

      // CASO 2: SEM ANOTAÇÕES → Salvar no Obsidian e Aprovar
      console.log('🟣 Salvando nota no Obsidian...');

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

console.log('✅ Lógica do handleSaveToVault atualizada!');
console.log('   Novo fluxo:');
console.log('   1. COM anotações:');
console.log('      → Envia feedback ao Claude Code (/api/deny)');
console.log('      → Claude Code recebe solicitação de alterações');
console.log('   2. SEM anotações:');
console.log('      → Salva no Obsidian (/api/save)');
console.log('      → Aprova automaticamente (/api/approve)');
console.log();
