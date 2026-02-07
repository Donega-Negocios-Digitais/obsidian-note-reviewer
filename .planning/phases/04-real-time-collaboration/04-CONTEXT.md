# Phase 4: Real-Time Collaboration - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Multiple users can collaborate on reviews with presence indicators showing who else is viewing the document, real-time cursors and avatars of active users, shareable links via friendly slug-based URLs, and guest access for viewing reviews without authentication. Native workflow with Obsidian vault allows local file access.

</domain>

<decisions>
## Implementation Decisions

### Experiência de Presença
- **Lista de usuários ativos**: Mostrar lista completa com avatares e nomes (não apenas contador)
- **Estilo de avatares**: Avatares coloridos (pixel art 16x16, GitHub-style, ou silhouetas estilizadas)
- **Indicador de status**: Mostrar "Fulano está digitando..." próximo ao avatar/nome
- **Animação de entrada/saída**: Fade suave (fade in/out) ao aparecer/desaparecer da sessão

### Comportamento de Cursores
- **Cores dos cursores**: Gerada automaticamente por usuário (hash do nome → cor única)
- **Visual do cursor**: Cursor + highlight (fundo colorido no texto selecionado)
- **Nome associado**: Tooltip flutuante acima do cursor
- **Comportamento quando inativo**: Esconder cursor após X segundos de inatividade

### Fluxo de Convidados
- **Permissões de visualização**: Visualização completa (veem anotações, autores, cursores)
- **Criação de anotações**: Convidados podem criar anotações persistentes (salvas como 'guest')
- **Indicador de modo guest**: Indicador sutil no topo (ícone de usuário + "Convidado")
- **Presença de convidados**: Presença completa (convidados veem cursores e lista de usuários, e vice-versa)

### Claude's Discretion
- Tempo exato de inatividade antes de esconder cursor (X segundos)
- Algoritmo de hash para geração de cores dos cursores
- Tamanho e estilo exato do tooltip do cursor
- Posicionamento exato da lista de presença na interface
- Animações de transições para highlight de seleção

</decisions>

<specifics>
## Specific Ideas

- Presença deve se sentir natural como no Google Docs ou Figma
- Cores dos cursores devem ser distinguíveis mas agradáveis visualmente
- Transições suaves para que a entrada/saída de usuários não seja disruptiva

</specifics>

<deferred>
## Deferred Ideas

- **Sistema de compartilhamento**: Geração de slugs, validação, quem pode compartilhar, expiração de links — não discutido nesta sessão, pode ser abordado no planejamento ou em discussão futura

</deferred>

---

*Phase: 04-real-time-collaboration*
*Context gathered: 2026-02-07*
