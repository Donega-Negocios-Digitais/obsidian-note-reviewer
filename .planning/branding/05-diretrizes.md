# 🎨 Diretrizes de Marca

## Tom, Voz e Identidade Visual

---

## 🗣️ Tom de Voz

### Atributos Principais

```yaml
Tom: Profissional mas Acessível
Voz: Especialista que simplifica
Personalidade: O dev produtivo que conhece o atalho
```

### Do's and Don'ts

| ✅ Faça | ❌ Não Faça |
|---------|-------------|
| Seja direto e técnico | Não seja corporativo demais |
| Use jargões dev quando apropriado | Não exclua não-devs |
| Mostre entusiasmo por produtividade | Não seja artificialmente hype |
| Valorize o tempo do usuário | Não seja verbose |
| Seja honesto sobre limitações | Não prometa o impossível |

### Exemplos de Copy

**Antes (Genérico):**
> "O obsidian-note-reviewer é uma ferramenta que permite revisar notas de forma eficiente."

**Depois (Com voz):**
> "Pare de copiar/colar do terminal. Reveja seus planos de IA em 30 segundos."

---

## 🎨 Identidade Visual (Diretrizes Futuras)

### Conceito Visual Sugerido

```
Inspirações: Linear, Raycast, Warp
Paleta: Escura (dark mode first) com acentos neon
Fonte: Monospace para código, Sans para UI
Ícone: Minimalista, sugere velocidade ou integração
```

### Elementos Sugeridos

1. **Cores:**
   - Background: `#0D0D0D` (quase preto)
   - Surface: `#1A1A1A` (cinza escuro)
   - Acento: `#4A90E2` (azul tecnológico) ou `#50C878` (verde produtividade)
   - Texto: `#FFFFFF` / `#CCCCCC`

2. **Tipografia:**
   - UI: Inter, SF Pro, ou similar
   - Código: JetBrains Mono, Fira Code

3. **Ícone/Logo:**
   - Conceito: "Flash" + "Documento" ou "Olho" + "Código"
   - Estilo: Minimalista, linhas finas

---

## 📱 Aplicações da Marca

### CLI/Terminal

```bash
# Formato do comando:
[nome] [ação] [arquivo]

# Exemplos:
planreview plan.md
obsreview --open last
snapreview --approve
```

### URL/Website

```
Home:      https://[nome].dev
Docs:      https://[nome].dev/docs
Install:   https://[nome].dev/install
Pricing:   https://[nome].dev/pricing
```

### Repositório GitHub

```
Repo: github.com/[user]/[nome]
Descrição: "[Tagline] - Integração Claude Code + Obsidian"
Topics: obsidian, claude-code, ai-workflow, markdown, productivity
```

### npm Package

```json
{
  "name": "[nome]",
  "description": "[Tagline]",
  "keywords": ["obsidian", "claude", "ai", "review", "markdown"],
  "bin": {
    "[nome]": "./dist/cli.js",
    "[atalho]": "./dist/cli.js"
  }
}
```

---

## 🏷️ Taglines por Nome

### `planreview`

| Contexto | Tagline |
|----------|---------|
| Hero | "Revise planos de IA em segundos" |
| CLI | "Review before you code" |
| Social | "10 minutos → 30 segundos" |
| GitHub | "Interactive plan review for Claude Code" |

### `obsreview`

| Contexto | Tagline |
|----------|---------|
| Hero | "A forma mais rápida de revisar no Obsidian" |
| CLI | "Review without leaving your terminal" |
| Social | "Obsidian + Claude Code = 🔥" |
| GitHub | "Seamless plan review for Obsidian users" |

### `snapreview`

| Contexto | Tagline |
|----------|---------|
| Hero | "Snap. Revise. Salve." |
| CLI | "Review at the speed of thought" |
| Social | "Mais rápido que copiar/colar" |
| GitHub | "Lightning-fast plan review for AI agents" |

---

## 📝 Glossário de Termos

### Termos Consistentes

| Conceito | Termo Oficial | Evitar |
|----------|---------------|--------|
| Ação de revisar | "Review" | "Checar", "Verificar" |
| Arquivo de plano | "Plan" | "Nota", "Documento" |
| Integração Claude | "Claude Code" | "Claude", "Anthropic" |
| Integração Obsidian | "Obsidian" | "Obs", "Vault" (exceto no nome) |
| Processo rápido | "30 seconds" | "Rápido", "Instantâneo" |
| Interface visual | "Portal", "UI" | "App", "Sistema" |

---

## 🎯 Mensagens-chave

### 1. Proposta de Valor Principal
> "Transforme 10 minutos de copiar/colar em 30 segundos de revisão visual."

### 2. Diferenciação
> "O único workflow que integra Claude Code, renderização perfeita e Obsidian em um comando."

### 3. Prova Social
> "Usado por devs que valorizam cada segundo do seu workflow."

### 4. Call to Action Primário
> "Instale em 30 segundos: `curl ... | bash`"

---

## 🔄 Evolução da Marca

### Fase 1: Lançamento (Agora)
- Foco: Nicho Obsidian + Claude Code
- Tom: Técnico, early adopter
- Mensagem: "Workflow otimizado"

### Fase 2: Crescimento (6 meses)
- Foco: Devs produtividade em geral
- Tom: Profissional, mas acessível
- Mensagem: "Ferramenta essencial"

### Fase 3: Escala (12+ meses)
- Foco: AI workflow tools
- Tom: Plataforma, ecossistema
- Mensagem: "O padrão para revisão de planos"

---

## 📐 Aplicações Práticas

### README.md Template

```markdown
# [Nome]

> [Tagline principal]

[Nome] é [descrição curta]. 
Ideal para [público] que [dores resolvidas].

## Instalação

\`\`\`bash
curl -fsSL https://[nome].dev/install.sh | bash
\`\`\`

## Uso

\`\`\`bash
# Revisar um plano
[nome] plan.md

# Aprovar automaticamente
[nome] plan.md --approve
\`\`\`

---

**[nome]** - [tagline curta]
```

### Tweet de Lançamento

```
🚀 Lançando [nome]: revise planos de Claude Code em 30 segundos.

Antes: Copiar → Colar → Formatar → Revisar → Salvar (10 min)
Agora: [nome] plan.md → Revisar → Salvar (30 seg)

Gratuito. Open source. Instalação em 1 comando.

→ https://[nome].dev

#ClaudeCode #Obsidian #Productivity
```

---

*[Próximo: Recomendação Final →](./06-recomendacao.md)*
