# Quick Start - Landing Page pt-BR

## ⚡ Testar Agora (30 segundos)

```bash
# 1. Navegar para a pasta do projeto
cd C:\dev\obsidian-note-reviewer

# 2. Iniciar servidor de desenvolvimento
bun run dev:marketing

# 3. Abrir no navegador
# http://localhost:3002/index.pt-br.html
```

Pronto! 🎉

## 📸 O que você vai ver

### Hero (Topo)
```
┌─────────────────────────────────────────┐
│  [Beta] Integração com Claude Code      │
│                                          │
│  Revise notas como elas                 │
│  merecem ser revisadas                  │
│                                          │
│  Interface visual que renderiza...      │
│                                          │
│  [Experimentar Grátis]  [Ver Demo]      │
└─────────────────────────────────────────┘
```

### Problema → Solução
```
┌───────────────────┬───────────────────┐
│   ANTES 😫        │   DEPOIS 😍       │
│                   │                   │
│ ✗ 10 min/doc      │ ✓ 30s/doc        │
│ ✗ Copia/cola      │ ✓ Automático     │
│ ✗ Frontmatter ✗   │ ✓ Preservado     │
└───────────────────┴───────────────────┘
```

### Workflow (30 segundos)
```
1 → AI Agent Termina (3s)
2 → Interface Abre (2s)
3 → Você Revisa (20s)
4 → Salvamento (5s)

TOTAL: ~30s vs 10min antes
```

## 🎨 Temas

A landing page suporta dark/light mode:

- **Default**: Dark mode
- **Toggle**: Botão no canto superior direito
- **Persistência**: Salvo em localStorage

## 📱 Testar Responsividade

```bash
# Abrir DevTools (F12)
# Clicar no ícone de dispositivo móvel
# Testar em:

- iPhone 12 Pro (390x844)
- iPad Air (820x1180)
- Desktop (1920x1080)
```

## 🔧 Fazer Alterações

### 1. Editar Texto

Arquivo: `packages/ui/components/LandingPtBr.tsx`

```tsx
// Linha ~47 - Hero headline
<h1 className="...">
  Revise notas como elas
  <br />
  <span className="...">
    merecem ser revisadas  {/* ← Edite aqui */}
  </span>
</h1>
```

### 2. Editar Benefícios

```tsx
// Linha ~237 - BenefitCard
<BenefitCard
  icon="🎨"
  title="Renderização Perfeita de Obsidian"  {/* ← Edite */}
  description="Único que renderiza callouts..." {/* ← Edite */}
/>
```

### 3. Editar FAQ

```tsx
// Linha ~473 - FAQItem
<FAQItem
  question="Não tenho tempo para aprender ferramenta nova" {/* ← Edite */}
  answer="Zero curva de aprendizado..." {/* ← Edite */}
/>
```

## 🏗️ Build para Produção

```bash
# 1. Build
bun run build:marketing

# 2. Arquivos gerados
apps/marketing/dist/
├── index.pt-br.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...

# 3. Preview local
cd apps/marketing/dist
python -m http.server 8000
# http://localhost:8000/index.pt-br.html
```

## 🚀 Deploy

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd apps/marketing
vercel --prod
```

### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
cd apps/marketing
netlify deploy --prod --dir=dist
```

### Opção 3: Manual (S3, VPS, etc.)

```bash
# Build
bun run build:marketing

# Upload pasta dist/ para seu servidor
# Apontar domínio para index.pt-br.html
```

## 🐛 Troubleshooting

### Erro: "Could not find root element"

**Solução**: Limpar cache do navegador (Ctrl+Shift+Delete)

### Erro: Componente não renderiza

**Solução**:
```bash
# Reinstalar dependências
bun install
# Reiniciar servidor
bun run dev:marketing
```

### Erro: Build falha

**Solução**:
```bash
# Verificar logs
bun run build:marketing 2>&1 | tee build.log

# Limpar cache
rm -rf node_modules/.vite
bun install
```

## ✅ Checklist de Review

Antes de mostrar para outras pessoas:

- [ ] Abrir em http://localhost:3002/index.pt-br.html
- [ ] Scrollar toda a página (topo → rodapé)
- [ ] Clicar em todos os CTAs (devem abrir links corretos)
- [ ] Testar modo dark/light (toggle no nav)
- [ ] Expandir todos os FAQs (devem abrir/fechar)
- [ ] Testar em mobile (DevTools → dispositivo móvel)
- [ ] Verificar texto (sem erros de português)
- [ ] Verificar links (GitHub, YouTube, etc.)

## 📊 Próximos Passos

1. **Review**: Mostrar para Alex Donega
2. **Ajustes**: Implementar feedback
3. **Screenshots**: Adicionar imagens reais do produto
4. **Deploy**: Publicar em https://r.alexdonega.com.br
5. **Medir**: Configurar analytics e acompanhar conversão

## 🎯 Objetivo Final

**Landing page que converte visitantes em usuários ativos do Note Reviewer.**

Métricas de sucesso:
- Taxa de clique no CTA principal > 15%
- Tempo médio na página > 2 minutos
- Taxa de scroll até FAQ > 40%

---

**Dúvidas?** Leia `LANDING-PAGE.md` (documentação completa) ou `README-PTBR.md` (overview geral).

**Pronto para começar?** 🚀
```bash
bun run dev:marketing
```
