# Incident Report - Commit 86704d1 (Performance checks)

## Context

Commit analisado: `86704d110ed6f4b21c3dbc22c8310e2b36a0399a`

Checks com falha no push:
- `Check Performance Budget`
- `Generate Performance Report`
- `Lighthouse Audit`
- `Memory Leak Detection`
- `Quick Load Test`
- `Web Vitals Check`

Check em paralelo:
- `Security Audit / security`

## O que quebrou (causa raiz)

As falhas nao vieram do codigo funcional do commit em si.  
A causa principal eh que o workflow `.github/workflows/performance-budget.yml` esta desalinhado com a estrutura atual do monorepo.

### 1) `Check Performance Budget`

Problemas:
- Tenta build em `packages/ui` com `bun run build` (`performance-budget.yml:29-30`)
- `packages/ui/package.json` nao tem script `build`
- Tenta rodar `node scripts/analyze-bundle.js` (`performance-budget.yml:37`) e esse arquivo nao existe
- Usa `budgetPath: ./lighthouse-budget.json` (`performance-budget.yml:45`) e esse arquivo nao existe

Resultado: falha imediata em poucos segundos.

### 2) `Lighthouse Audit`

Problemas:
- Tenta `bun run build` em `packages/ui` (`performance-budget.yml:95-96`) sem script
- Tenta `bun run preview` em `packages/ui` (`performance-budget.yml:100-101`) sem script
- Depois chama `node scripts/check-lighthouse-scores.js` (`performance-budget.yml:116`) e o script nao existe
- `.lighthouserc.json` usa `startServerCommand: "npm run preview"` (linha 5), mas o `package.json` raiz nao tem script `preview`

Resultado: job quebra antes da auditoria util.

### 3) `Web Vitals Check`

Problemas:
- Build em `packages/ui` (`performance-budget.yml:135-136`) sem script `build`
- Executa `bun run test:vitals` (`performance-budget.yml:141`) e `packages/ui` nao tem esse script

Resultado: falha imediata.

### 4) `Memory Leak Detection`

Problemas:
- Executa `bun run test:memory` em `packages/ui` (`performance-budget.yml:221`) e script nao existe
- Executa `node scripts/check-memory-leaks.js` (`performance-budget.yml:225`) e script nao existe

Resultado: falha imediata.

### 5) `Quick Load Test`

Problemas:
- Tenta subir API em `packages/api` com `bun run dev` (`performance-budget.yml:185-186`)
- `packages/api` nao tem `package.json` nem script `dev`
- Script de validacao opcional `scripts/check-load-test-results.js` tambem nao existe

Resultado: k6 nao encontra backend valido para o cenario esperado.

### 6) `Generate Performance Report`

Problemas:
- Depende de jobs que ja falharam (`needs: [performance-budget, lighthouse-audit, web-vitals, load-test]`)
- Tenta rodar `node scripts/generate-performance-report.js` (`performance-budget.yml:249`) e script nao existe

Resultado: falha em cascata.

## Confirmacao importante

Esse workflow problematico ja estava quebrando antes do commit `86704d1`.  
Ou seja, o commit disparou os checks, mas nao criou sozinho essa estrutura quebrada.

## Solucao recomendada (urgente + correta)

## Fase 1 - Mitigacao imediata (hoje)

Objetivo: parar falha automatica enquanto corrigimos direito.

Opcao rapida:
- Alterar trigger do workflow de performance para `workflow_dispatch` (manual) temporariamente
- Ou limitar para rodar apenas em PR de uma branch tecnica de observabilidade

Isso evita bloquear push com checks que hoje estao estruturalmente invalidos.

## Fase 2 - Alinhar workflow com o projeto real

Trocar alvo de `packages/ui` para `apps/portal`, que tem scripts reais:
- `apps/portal/package.json` possui `build` e `preview`

Ajustes:
- Build: `bun run --cwd apps/portal build`
- Preview: `bun run --cwd apps/portal preview --host 0.0.0.0 --port 4173`
- Lighthouse deve apontar para esse servidor
- Remover chamadas a scripts inexistentes em `scripts/` ate eles serem implementados

## Fase 3 - Reintroduzir validacoes por etapas

Reativar gradualmente:
1. Lighthouse funcional no `apps/portal`
2. Bundle report real (com script existente)
3. Web vitals (quando existir `test:vitals`)
4. Memory check (quando existir `test:memory`)
5. Load test com backend real executavel no CI

## Plano tecnico objetivo (checklist)

1. Corrigir `.github/workflows/performance-budget.yml`:
- Remover/ajustar todas as referencias para `packages/ui`
- Remover/ajustar referencias para scripts Node inexistentes
- Ajustar etapas de lighthouse para `apps/portal`

2. Corrigir `.lighthouserc.json`:
- Trocar `startServerCommand` para comando real do portal

3. Criar (ou remover) dependencias de script:
- `scripts/analyze-bundle.js`
- `scripts/check-lighthouse-scores.js`
- `scripts/check-memory-leaks.js`
- `scripts/check-load-test-results.js`
- `scripts/generate-performance-report.js`

4. So reabilitar etapas extras quando scripts existirem e passarem localmente.

## Comandos de verificacao local apos ajuste

```bash
bun install
bun run --cwd apps/portal build
bun run --cwd apps/portal preview
```

Em outro terminal:

```bash
# Lighthouse local (exemplo)
npx @lhci/cli autorun --config=.lighthouserc.json
```

## Conclusao

O incidente nao eh "codigo do commit que quebrou tudo".  
O que falhou foi o pipeline de performance, que referencia caminhos e scripts que nao existem no repositorio atual.

Corrigindo o workflow para `apps/portal` e removendo dependencias inexistentes, os checks voltam a refletir qualidade real do projeto.
