# Documentação Plannotator - Aula Fullstack para Alex

## Bem-vindo ao Mundo do Desenvolvimento!

Esta documentação foi criada especialmente para você, Alex! Aqui vou te explicar **TUDO** sobre este projeto de forma simples, como se estivéssemos conversando. Você vai aprender desenvolvimento fullstack usando seu próprio projeto como exemplo.

---

## O Que é Este Projeto?

**Plannotator** (nome interno: obsidian-note-reviewer) é uma ferramenta para:

1. **Revisar planos de código** - Quando o Claude Code cria um plano, você pode revisar visualmente
2. **Fazer anotações em documentos** - Marcar trechos, adicionar comentários, sugerir mudanças
3. **Aprovar ou rejeitar planos** - Workflow de aprovação integrado ao Claude Code
4. **Integração com Obsidian** - Funciona com seus vaults do Obsidian

### Analogia Simples

Pense assim: sabe quando você revisa um documento do Word e usa "Controlar Alterações"? O Plannotator faz isso para **planos de código** e **documentos Markdown**!

---

## O Que Você Vai Aprender Nesta Documentação

| Arquivo | O Que Você Vai Aprender |
|---------|------------------------|
| `01-CONCEITOS-BASICOS.md` | O que é frontend, backend, API, etc |
| `02-ESTRUTURA-MONOREPO.md` | Por que o projeto tem essa estrutura |
| `03-APPS-EXPLICADOS.md` | Cada aplicação e como funciona |
| `04-PACKAGES-EXPLICADOS.md` | Código compartilhado entre apps |
| `05-FLUXO-DADOS.md` | Como as informações viajam no sistema |
| `06-STACK-TECNICA.md` | Todas as tecnologias usadas |
| `07-VIBE-CODING-CLAUDE.md` | Como usar Claude Code para desenvolver |

---

## Visão Geral Rápida do Projeto

```
O QUE O PLANNOTATOR FAZ:

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  VOCÊ cria um plano no Claude Code                          │
│       ↓                                                      │
│  O HOOK abre uma janela visual bonita                       │
│       ↓                                                      │
│  VOCÊ revisa, anota, comenta                                │
│       ↓                                                      │
│  VOCÊ aprova ou pede mudanças                               │
│       ↓                                                      │
│  O CLAUDE CODE recebe seu feedback                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## As 3 Aplicações do Projeto

O projeto tem **3 apps diferentes** que fazem coisas diferentes:

### 1. Hook (Plugin do Claude Code)
- **O que faz**: Abre uma janelinha quando você está revisando planos
- **Porta**: 3000
- **Uso**: Dentro do Claude Code, automaticamente

### 2. Portal (Site Web Completo)
- **O que faz**: Versão web completa com login, colaboração
- **Porta**: 3001
- **Uso**: Acessar pelo navegador para features avançadas

### 3. Marketing (Landing Page)
- **O que faz**: Página de vendas/apresentação do produto
- **Porta**: 3002
- **Uso**: Mostrar o produto para potenciais clientes

---

## Por Que Um "Monorepo"?

**Monorepo** = "Mono" (um) + "Repo" (repositório)

É quando você tem **várias aplicações em um único repositório Git**.

### Vantagens:
- Código compartilhado entre apps (não precisa duplicar)
- Uma única versão de dependências
- Mais fácil de manter consistência
- Deploy coordenado

### Estrutura Visual:

```
obsidian-note-reviewer/          ← RAIZ (monorepo)
├── apps/                        ← APLICAÇÕES
│   ├── hook/                    ← App 1
│   ├── portal/                  ← App 2
│   └── marketing/               ← App 3
├── packages/                    ← CÓDIGO COMPARTILHADO
│   ├── ui/                      ← Componentes visuais
│   ├── editor/                  ← Editor principal
│   ├── security/                ← Segurança
│   ├── api/                     ← Chamadas de API
│   └── shared/                  ← Utilitários
└── [arquivos de config]         ← Configurações
```

---

## Tecnologias Principais (Resumo)

| Categoria | Tecnologia | Para Que Serve |
|-----------|-----------|----------------|
| **Runtime** | Bun | Executa JavaScript/TypeScript |
| **Frontend** | React 19 | Cria interfaces de usuário |
| **Estilo** | Tailwind CSS | CSS com classes utilitárias |
| **Build** | Vite | Compila e serve o projeto |
| **Linguagem** | TypeScript | JavaScript com tipos |
| **Backend** | Supabase | Banco de dados e autenticação |
| **Pagamentos** | Stripe | Processar assinaturas |

---

## Como Rodar o Projeto

```bash
# 1. Instalar dependências
bun install

# 2. Rodar o Hook (plugin Claude Code)
bun run dev:hook

# 3. OU rodar o Portal (site web)
bun run dev:portal

# 4. OU rodar o Marketing (landing page)
bun run dev:marketing
```

---

## Próximos Passos

Agora que você tem uma visão geral, leia os arquivos na ordem:

1. **Comece por**: `01-CONCEITOS-BASICOS.md` - entenda os fundamentos
2. **Depois**: `02-ESTRUTURA-MONOREPO.md` - como o projeto é organizado
3. **Continue**: nos outros arquivos...

Cada arquivo vai aprofundar um aspecto específico, sempre com exemplos do próprio projeto!

---

## Dica de Ouro: Vibe Coding com Claude Code

O arquivo `07-VIBE-CODING-CLAUDE.md` é especial! Ele ensina como usar o Claude Code para:

- Entender código existente
- Fazer modificações
- Criar novas features
- Debugar problemas

**Vibe Coding** = Programar de forma fluida e intuitiva, usando IA como parceiro!

---

*Documentação criada com carinho pelo Claude Code para Alex Donega*
*Versão: 0.2.1 | Data: Janeiro 2026*
