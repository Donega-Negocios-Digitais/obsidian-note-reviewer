# Brand Assets
## Recursos da Marca

---

## 📦 Visão Geral

Este documento cataloga todos os assets da marca **obsreview** disponíveis para uso em diferentes contextos e aplicações.

### Licença de Uso

```
Copyright 2026 obsreview

Licenciado sob MIT License

Você pode:
- Usar em projetos pessoais e comerciais
- Modificar e adaptar
- Distribuir

Você deve:
- Incluir a nota de licença
- Atribuir créditos quando apropriado
```

---

## 🎯 Logotipos

### Download de Logos

```
brand-assets/logo/
├── primary/
│   ├── obsreview-logo-horizontal.svg        # Logo principal (vetor)
│   ├── obsreview-logo-horizontal.png        # Logo principal (PNG 1024px)
│   ├── obsreview-logo-horizontal@2x.png     # Logo principal (PNG 2048px)
│   └── obsreview-logo-icon.svg              # Icone apenas (vetor)
├── monochrome/
│   ├── obsreview-logo-mono.svg              # Monocromático (vetor)
│   └── obsreview-logo-mono.png              # Monocromático (PNG)
├── dark/
│   ├── obsreview-logo-dark.svg              # Fundo escuro (vetor)
│   └── obsreview-logo-dark.png              # Fundo escuro (PNG)
└── favicon/
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── favicon-96x96.png
    ├── apple-touch-icon.png
    └── site.webmanifest
```

### Uso por Contexto

| Contexto | Arquivo | Formato | Tamanho |
|----------|---------|---------|---------|
| **Website header** | `horizontal.svg` | SVG | 100% |
| **Apresentações** | `horizontal@2x.png` | PNG | 2048px |
| **Impresso** | `mono.svg` | SVG | 100% |
| **Favicon** | `favicon-32x32.png` | PNG | 32px |
| **App Icon** | `icon.svg` | SVG | 512px |

### Limites de Uso

| Aplicação | Tamanho Mínimo | Formato Recomendado |
|-----------|----------------|---------------------|
| Digital | 120px largura | SVG |
| Impresso | 25mm largura | SVG/PNG 300dpi |
| Favicon | 32x32px | PNG |
| Social Media | 400x400px | PNG |

---

## 🎨 Cores

### Paleta Completa

Download dos arquivos de paleta:

```
brand-assets/colors/
├── obsreview-color-palette.ase       # Adobe Swatch Exchange
├── obsreview-color-palette.clr       # macOS Color List
├── obsreview-color-palette.json      # Design tokens
├── obsreview-color-palette.sketchpalette  # Sketch
└── obsreview-color-palette.css       # CSS variables
```

### CSS Variables (Copiar e Colar)

```css
:root {
  /* Brand Purple */
  --obs-purple-50: #F5F3FF;
  --obs-purple-100: #EDE9FE;
  --obs-purple-200: #DDD6FE;
  --obs-purple-300: #C4B5FD;
  --obs-purple-400: #A78BFA;
  --obs-purple-500: #8B5CF6;
  --obs-purple-600: #7C3AED;
  --obs-purple-700: #6D28D9;
  --obs-purple-800: #5B21B6;
  --obs-purple-900: #4C1D95;

  /* Review Green */
  --obs-green-50: #ECFDF5;
  --obs-green-100: #D1FAE5;
  --obs-green-200: #A7F3D0;
  --obs-green-300: #6EE7B7;
  --obs-green-400: #34D399;
  --obs-green-500: #10B981;
  --obs-green-600: #059669;
  --obs-green-700: #047857;
  --obs-green-800: #065F46;
  --obs-green-900: #064E3B;

  /* Semantic */
  --obs-success: #10B981;
  --obs-warning: #F59E0B;
  --obs-error: #EF4444;
  --obs-info: #3B82F6;

  /* Neutral */
  --obs-gray-50: #F9FAFB;
  --obs-gray-100: #F3F4F6;
  --obs-gray-200: #E5E7EB;
  --obs-gray-300: #D1D5DB;
  --obs-gray-400: #9CA3AF;
  --obs-gray-500: #6B7280;
  --obs-gray-600: #4B5563;
  --obs-gray-700: #374151;
  --obs-gray-800: #1F2937;
  --obs-gray-900: #111827;
}
```

---

## 🔤 Tipografia

### Fontes

**Inter** (UI Text)
- Download: https://fonts.google.com/share?selection?family=Inter:wght@400;500;600;700
- Licença: SIL Open Font License 1.1
- Uso: Interface, headings, body text

**JetBrains Mono** (Code)
- Download: https://fonts.google.com/share?selection?family=JetBrains+Mono:wght@400;500
- Licença: SIL Open Font License 1.1
- Uso: Code blocks, terminal, dados técnicos

### Arquivos de Fonte

```
brand-assets/fonts/
├── inter/
│   ├── Inter-Regular.ttf
│   ├── Inter-Medium.ttf
│   ├── Inter-SemiBold.ttf
│   └── Inter-Bold.ttf
├── jetbrains-mono/
│   ├── JetBrainsMono-Regular.ttf
│   └── JetBrainsMono-Medium.ttf
└── webfonts/
    ├── inter.css
    └── jetbrains-mono.css
```

---

## 🎯 Ícones

### Biblioteca de Ícones

Usamos **Lucide Icons** como base.

```
brand-assets/icons/
├── svg/                          # Ícones SVG originais
│   ├── check.svg
│   ├── x.svg
│   ├── eye.svg
│   ├── edit.svg
│   └── ...
├── font/                         # Web font (opcional)
│   ├── obsreview-icons.woff
│   └── obsreview-icons.woff2
└── react/                        # Componentes React
    └── icons.tsx
```

### Ícones Principais

| Ícone | Nome | SVG | Uso |
|-------|------|-----|-----|
| ✓ | check | [SVG](#) | Aprovar |
| ✗ | x | [SVG](#) | Rejeitar |
| 👁 | eye | [SVG](#) | Visualizar |
| ✏ | edit | [SVG](#) | Editar |
| 💬 | message-square | [SVG](#) | Comentar |
| ➕ | plus | [SVG](#) | Adicionar |
| 🔄 | refresh-ccw | [SVG](#) | Atualizar |
| ⚙ | settings | [SVG](#) | Configurações |

---

## 📐 Templates

### Apresentações

```
brand-assets/templates/
└── presentations/
    ├── obsreview-presentation-template.pptx     # PowerPoint
    ├── obsreview-presentation-template.key      # Keynote
    └── obsreview-presentation-template.pdf      # PDF (referência)
```

### Slides Template Inclui:

- Slide de título com logo
- Slide de conteúdo (com grid)
- Slide de conclusão
- Slide de Q&A
- Cores da marca aplicadas
- Tipografia configurada

### Documentos

```
brand-assets/templates/
└── documents/
    ├── obsreview-document-template.docx        # Word
    ├── obsreview-document-template.pages       # Pages
    └── obsreview-letter-template.pdf           # PDF
```

### Social Media

```
brand-assets/templates/
└── social-media/
    ├── twitter/
    │   ├── profile-header.png                  # 1500x500px
    │   └── post-template.png                   # 1200x675px
    ├── linkedin/
    │   ├── banner.png                          # 1584x396px
    │   └── post-template.png                   # 1200x627px
    └── github/
        └── social-preview.png                  # 1280x640px
```

---

## 🎥 Mídia

### Screenshots

```
brand-assets/screenshots/
├── ui/
│   ├── main-interface.png                      # Interface principal
│   ├── diff-viewer.png                         # Comparação
│   ├── annotation-toolbar.png                  # Toolbar
│   └── settings.png                            # Configurações
├── workflows/
│   ├── workflow-1.png                          # Workflow exemplo 1
│   └── workflow-2.png                          # Workflow exemplo 2
└── dark-mode/
    ├── main-interface-dark.png
    └── diff-viewer-dark.png
```

### Vídeos

```
brand-assets/videos/
├── demos/
│   ├── quick-start.mp4                         # Demo rápida (60s)
│   └── full-tour.mp4                           # Tour completo (5min)
├── tutorials/
│   ├── installation.mp4
│   └── configuration.mp4
└── promo/
    └── launch-promo.mp4                        # Vídeo promocional
```

---

## 📱 Imagens de App

### App Icons

```
brand-assets/app-icons/
├── macos/
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-128x128.png
│   ├── icon-256x256.png
│   ├── icon-512x512.png
│   └── icon-1024x1024.png
├── windows/
│   ├── icon.ico                                # Multi-resolução
│   └── icon.png
└── ios/
    ├── icon-60@2x.png                          # 120x120
    ├── icon-60@3x.png                          # 180x180
    ├── icon-76@2x.png                          # 152x152
    └── icon-167@167.png                        # 167x167
```

### Splash Screens

```
brand-assets/splash/
├── splash-640x1136.png                         # iPhone SE
├── splash-750x1334.png                         # iPhone 8
├── splash-1242x2208.png                        # iPhone 8 Plus
├── splash-1125x2436.png                        # iPhone X
├── splash-1242x2688.png                        # iPhone XS Max
└── splash-2048x2732.png                        # iPad Pro
```

---

## 🎨 Merchandising

### Mockups

```
brand-assets/mockups/
├── t-shirt/
│   ├── obsreview-tshirt-mockup-front.png
│   └── obsreview-tshirt-mockup-back.png
├── stickers/
│   ├── obsreview-sticker-circle.png
│   └── obsreview-sticker-square.png
└── laptop/
    ├── obsreview-laptop-decal-macbook.png
    └── obsreview-laptop-decal-generic.png
```

### Materiais de Eventos

```
brand-assets/events/
├── banners/
│   ├── roll-up-banner.pdf                      # 85x200cm
│   └── pull-up-banner.pdf                      # 80x200cm
├── flyers/
│   ├── flyer-a4.pdf
│   └── flyer-a5.pdf
└── badges/
    └── attendee-badge.pdf
```

---

## 🔧 Ferramentas

### Figma

**Design System File**: https://figma.com/file/obsreview-design-system

Inclui:
- Componentes principais
- Tokens de design
- Pages templates
- Variantes de componentes

### Sketch

**Design System File**: [Disponível em breve]

### Adobe XD

**Design System File**: [Disponível em breve]

---

## 📥 Download Rápido

### Bundle Completo

```bash
# Baixar todos os assets
curl -O https://cdn.obsreview.app/brand-assets.zip

# Ou via GitHub Releases
wget https://github.com/obsreview/brand/releases/latest/download/brand-assets.zip
```

### Assets Individuais

```bash
# Logo SVG
curl -O https://cdn.obsreview.app/logo/obsreview-logo-horizontal.svg

# Paleta de cores (JSON)
curl -O https://cdn.obsreview.app/colors/obsreview-color-palette.json

# Favicon
curl -O https://cdn.obsreview.app/favicon/favicon-32x32.png
```

---

## 🚫 Uso Incorreto

### O que EVITAR

| ❌ Não Faça | ✅ Faça Instead |
|-------------|-----------------|
| Esticar o logo | Usar versão apropriada |
| Alterar cores do logo | Usar variações oficiais |
| Adicionar efeitos | Manter clean |
| Usar em fundo de baixo contraste | Verificar contraste |
| Reduzir abaixo do mínimo | Usar ícone |

### Exemplos de Uso Incorreto

```
brand-assets/examples/
├── dont/
│   ├── logo-stretched.png                      # Logo esticado
│   ├── logo-wrong-colors.png                   # Cores erradas
│   └── logo-bad-contrast.png                   # Baixo contraste
└── do/
    ├── logo-correct.png                        # Uso correto
    ├── logo-dark-bg.png                        # Fundo escuro
    └── icon-only.png                           # Icone apenas
```

---

## 📞 Contato e Suporte

### Solicitar Assets Adicionais

Precisa de um asset que não está listado aqui?

1. Verifique se existe em [`brand-assets/`](./)
2. Abra uma issue no GitHub
3. Entre em contato: brand@obsreview.app

### Reportar Problemas

Encontrou um problema com algum asset?

- Abra uma issue com a tag "brand-assets"
- Inclua descrição detalhada
- Anexe screenshot se aplicável

---

**Última atualização**: 2026-02-08
**Versão**: 1.0.0
**Licença**: MIT
