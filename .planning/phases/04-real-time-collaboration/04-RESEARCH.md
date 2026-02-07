# Phase 4: Real-Time Collaboration - Research

**Researched:** 2026-02-07
**Domain:** Real-time collaboration, presence systems, guest access
**Confidence:** HIGH

## Summary

This research phase investigated implementing real-time collaboration features for the Obsidian Note Reviewer portal, including multi-user presence indicators, real-time cursor tracking with color coding, and guest access for shared reviews. The standard approach for React-based real-time collaboration is **Liveblocks** (v3.13.4), which provides production-ready presence systems, cursor synchronization, and room-based collaboration patterns. The existing Supabase infrastructure can be extended for guest access using Row Level Security (RLS) policies with the 'anon' role.

**Primary recommendation:** Use Liveblocks for real-time presence/cursors, extend existing Supabase auth for guest access, and integrate with Obsidian's URI protocol for local vault workflows.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Presena de Usuarios
- **Lista de usuarios ativos**: Mostrar lista completa com avatares e nomes (nao apenas contador)
- **Estilo de avatares**: Avatares coloridos (pixel art 16x16, GitHub-style, ou silhuetas estilizadas)
- **Indicador de status**: Mostrar "Fulano est digitando..." proximo ao avatar/nome
- **Animacao de entrada/saida**: Fade suave (fade in/out) ao aparecer/desaparecer da sessao

#### Comportamento de Cursores
- **Cores dos cursores**: Gerada automaticamente por usuario (hash do nome -> cor unica)
- **Visual do cursor**: Cursor + highlight (fundo colorido no texto selecionado)
- **Nome associado**: Tooltip flutuante acima do cursor
- **Comportamento quando inativo**: Esconder cursor apos X segundos de inatividade

#### Fluxo de Convidados
- **Permissoes de visualizacao**: Visualizacao completa (veem anotacoes, autores, cursores)
- **Criacao de anotacoes**: Convidados podem criar anotacoes persistentes (salvas como 'guest')
- **Indicador de modo guest**: Indicador sutil no topo (icone de usuario + "Convidado")
- **Presenca de convidados**: Presenca completa (convidados veem cursores e lista de usuarios, e vice-versa)

### Claude's Discretion
- Tempo exato de inatividade antes de esconder cursor (X segundos)
- Algoritmo de hash para geracao de cores dos cursores
- Tamanho e estilo exato do tooltip do cursor
- Posicionamento exato da lista de presenca na interface
- Animacoes de transicoes para highlight de selecao

### Deferred Ideas (OUT OF SCOPE)
- **Sistema de compartilhamento**: Geracao de slugs, validacao, quem pode compartilhar, expiracao de links — nao discutido nesta sessao, pode ser abordado no planejamento ou em discussao futura

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @liveblocks/react | 3.13.4 | Real-time presence & cursors | Production-ready React hooks for collaboration |
| @liveblocks/node | 3.13.4 | Server-side Liveblocks auth | Backend authentication for Liveblocks rooms |
| @supabase/supabase-js | 2.89.0 | Guest access & auth | Already in use, extends to guest permissions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | 5.0.9 | URL-friendly unique IDs | Shareable link slugs (if needed) |
| color-hash | 2.0.2 | Consistent color from strings | Cursor color generation from usernames |
| zustand | 5.0.9 | State management | Already in use for portal state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Liveblocks | Yjs + Hocuspocus | More complex setup, lighter weight |
| color-hash | string-to-color | Fewer customization options |
| Liveblocks | PartyKit | Newer, less battle-tested |

**Installation:**
```bash
bun add @liveblocks/react @liveblocks/node
bun add -D @liveblocks/eslint-config
```

## Architecture Patterns

### Recommended Project Structure
```
apps/portal/src/
├── lib/
│   ├── liveblocks.ts       # Liveblocks client configuration
│   ├── liveblocks-auth.ts  # Auth endpoint wrapper
│   └── cursor-colors.ts    # Color hash utilities
├── components/
│   ├── collaboration/
│   │   ├── PresenceList.tsx      # Active users display
│   │   ├── LiveCursors.tsx       # Cursor rendering layer
│   │   ├── Cursor.tsx            # Individual cursor component
│   │   └── GuestBadge.tsx        # Guest mode indicator
│   └── hooks/
│       ├── usePresence.ts        # Wrapper for Liveblocks presence
│       └── useCursorColor.ts     # Color generation hook
└── app/
    └── api/
        └── liveblocks-auth/
            └── route.ts           # Liveblocks auth endpoint (Vite: /api/auth.ts)
```

### Pattern 1: Liveblocks Room Provider

**What:** Wrap collaboration features with Liveblocks providers for real-time state sync
**When to use:** Root layout or note review page component

**Example:**
```typescript
// Source: https://liveblocks.io/docs/rooms/liveblocks-provider
import { createClient } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export function ReviewRoom({ children, noteId }: { children: ReactNode; noteId: string }) {
  return (
    <LiveblocksProvider client={client}>
      <RoomProvider id={noteId}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
```

### Pattern 2: Presence Tracking

**What:** Track user cursor position, selection, and typing status
**When to use:** Any collaborative component

**Example:**
```typescript
// Source: https://liveblocks.io/docs/presence-and-cursors/real-time-cursors
import { useMyPresence, useOthers } from "@liveblocks/react";

export function LiveCursors() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  // Update cursor position on mouse move
  const handleMouseMove = (e: MouseEvent) => {
    updateMyPresence({
      cursor: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  };

  return (
    <>
      {others.map((other) => (
        other.presence.cursor && (
          <Cursor
            key={other.connectionId}
            x={other.presence.cursor.x}
            y={other.presence.cursor.y}
            color={stringToColor(other.info.name)}
            name={other.info.name}
          />
        )
      ))}
    </>
  );
}
```

### Pattern 3: Supabase Guest Access

**What:** Use Supabase RLS to allow anonymous access to shared notes
**When to use:** Guest viewing of public reviews

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/auth/row-level-security
-- Enable anonymous access
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view public notes
CREATE POLICY "Public notes are viewable by everyone"
  ON notes FOR SELECT
  USING (is_public = true);

-- Allow anonymous (guest) annotations on public notes
CREATE POLICY "Guests can annotate public notes"
  ON annotations FOR INSERT
  WITH CHECK (
    note_id IN (
      SELECT id FROM notes WHERE is_public = true
    ) AND
    user_id IS NULL  -- NULL indicates guest
  );
```

### Anti-Patterns to Avoid
- **Polling for presence:** Use WebSocket-based Liveblocks instead
- **Storing cursors in database:** Presence is temporary, use Liveblocks broadcast
- **Custom WebSocket implementation:** Liveblocks handles reconnection, edge cases
- **Ignoring offline state:** Handle disconnection gracefully in UI

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time presence sync | Custom WebSocket + state | Liveblocks useMyPresence/useOthers | Handles reconnection, conflict resolution, edge cases |
| Cursor position synchronization | Manual position broadcasting | Liveblocks presence system | Optimized updates, collision handling, inactive user cleanup |
| Color generation from strings | Custom hash function | color-hash library | Tested color distribution, WCAG contrast handling |
| Guest authentication system | Custom guest tokens | Supabase anon key + RLS | Built-in security policies, rate limiting |
| URL-safe unique IDs | UUID + base64 encoding | NanoID | Shorter, URL-safe, no special characters |

**Key insight:** Real-time features have subtle edge cases (network partition, late joiners, rapid updates). Liveblocks has handled these at scale.

## Common Pitfalls

### Pitfall 1: Presence Memory Leak
**What goes wrong:** Presence updates accumulate, causing performance degradation
**Why it happens:** Not clearing presence on component unmount or user inactivity
**How to avoid:**
```typescript
useEffect(() => {
  // Clear presence on unmount
  return () => {
    updateMyPresence({ cursor: null, selection: null });
  };
}, [updateMyPresence]);
```
**Warning signs:** Slower cursor updates after extended session

### Pitfall 2: Cursor Color Collision
**What goes wrong:** Multiple users get similar or identical cursor colors
**Why it happens:** Poor hash algorithm or insufficient color space
**How to avoid:** Use tested library (color-hash) with HSL color space
**Warning signs:** Users can't distinguish cursors in active sessions

### Pitfall 3: Guest Data Leakage
**What goes wrong:** Guests can access private notes or modify data
**Why it happens:** Incomplete RLS policies or missing auth checks
**How to avoid:**
```typescript
// Always verify note visibility
const { data: note } = await supabase
  .from('notes')
  .select('*')
  .eq('slug', slug)
  .eq('is_public', true)  // Critical check
  .single();
```
**Warning signs:** Can access private notes via URL manipulation

### Pitfall 4: Missing Offline Handling
**What goes wrong:** UI breaks when connection drops
**Why it happens:** Assuming always-connected WebSocket
**How to avoid:**
```typescript
const { connectionState } = useRoom();
const isConnected = connectionState === 'connected';

// Show connection status
{!isConnected && <ConnectionStatusBanner />}
```
**Warning signs:** Cursors disappear, no error feedback

### Pitfall 5: Obsidian URI Protocol Misuse
**What goes wrong:** Deep links don't open in local Obsidian app
**Why it happens:** Incorrect URI format or missing vault path
**How to avoid:**
```typescript
// Format: obsidian://vault/path/to/file#heading
const obsidianUri = `obsidian://${vaultName}/${encodeURIComponent(filePath)}`;
```
**Warning signs:** Links open in browser instead of Obsidian

## Code Examples

### Liveblocks Auth Endpoint

```typescript
// Source: https://liveblocks.io/docs/authentication/no-backend
// apps/portal/src/app/api/liveblocks-auth/route.ts (Vite: /api/auth.ts)
import { createClient } from "@liveblocks/node";
import { currentUser } from "@/lib/auth";  // Your existing auth

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
  // Get authenticated user (or guest)
  const user = await currentUser();

  // Create Liveblocks session
  const session = liveblocks.prepareSession(
    user?.id ?? `guest-${nanoid()}`,  // Guest ID if no user
    {
      userInfo: {
        name: user?.name ?? "Guest",
        avatar: user?.avatar_url,
        isGuest: !user,
      },
    }
  );

  // Allow access to note room
  const { noteId } = await req.json();
  session.allow(noteId, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
```

### Cursor Component with Tooltip

```typescript
// Source: https://liveblocks.io/docs/presence-and-cursors/cursor-positions
import { memo } from "react";

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

export const Cursor = memo(({ x, y, color, name }: CursorProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cursor pointer */}
      <path
        d="M0 0 L8 8 L4 8 L0 12 Z"
        fill={color}
        strokeWidth={1}
        stroke="white"
      />
      {/* Name label */}
      <text
        x={12}
        y={16}
        fill={color}
        fontSize={12}
        fontWeight="bold"
      >
        {name}
      </text>
    </g>
  );
});
```

### Inactive Cursor Hiding

```typescript
// Source: https://liveblocks.io/docs/presence-and-cursors/presence
import { useEffect } from "react";

const INACTIVE_TIMEOUT = 5000;  // 5 seconds - Claude's discretion

export function useInactiveCursor() {
  const [myPresence, updateMyPresence] = useMyPresence();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateMyPresence({ cursor: null });
      }, INACTIVE_TIMEOUT);
    };

    window.addEventListener("mousemove", resetTimer);
    resetTimer();  // Initial start

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
    };
  }, [updateMyPresence]);
}
```

### String to Color Hash

```typescript
// Source: https://www.npmjs.com/package/color-hash
import ColorHash from "color-hash";

const colorHash = new ColorHash({
  hue: { min: 0, max: 360 },
  saturation: [0.6, 0.8],  // Avoid too light/dark
  lightness: [0.4, 0.6],
});

export function getCursorColor(name: string): string {
  return colorHash.hex(name);
}
```

### Presence List Component

```typescript
// Source: https://liveblocks.io/docs/presence-and-cursors/presence
import { useOthers } from "@liveblocks/react";
import { getCursorColor } from "@/lib/cursor-colors";

export function PresenceList() {
  const others = useOthers();

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
      {others.map((other) => (
        <div
          key={other.connectionId}
          className="relative group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: getCursorColor(other.info.name) }}
          >
            {other.info.name[0].toUpperCase()}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {other.info.name}
          </div>
          {/* Typing indicator */}
          {other.presence.isTyping && (
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
              typing...
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom WebSocket + polling | Liveblocks presence | 2023+ | Simplified implementation, better UX |
| UUID for slugs | NanoID | 2020+ | Shorter URLs, no special characters |
| Manual auth checks | Supabase RLS policies | 2022+ | Database-level security, simpler code |

**Deprecated/outdated:**
- Socket.IO presence: Overkill for document collaboration
- Operative/Transform: Too complex for this use case
- Custom color hashing: Use tested libraries instead

## Open Questions

1. **Guest annotation persistence**
   - What we know: Guests can create annotations, saved as 'guest' (user_id = NULL)
   - What's unclear: Should guests be able to edit/delete their own annotations later?
   - Recommendation: Store guest_id in annotation metadata for later identification

2. **Cursor inactivity timeout**
   - What we know: User decided to hide inactive cursors after "X seconds"
   - What's unclear: Exact timeout value
   - Recommendation: Use 5 seconds as default (matches Google Docs), make configurable

3. **Obsidian vault integration**
   - What we know: Obsidian uses obsidian:// protocol for deep links
   - What's unclear: How to detect user's vault name and file structure
   - Recommendation: Store vault path in user preferences, allow manual configuration

4. **Presence list positioning**
   - What we know: Should show full list with avatars
   - What's unclear: Exact UI placement (header? sidebar? floating?)
   - Recommendation: Place in header near document title for maximum visibility

## Sources

### Primary (HIGH confidence)
- Liveblocks Documentation - https://liveblocks.io/docs - Room providers, presence system, cursor tracking, authentication
- Supabase RLS Documentation - https://supabase.com/docs/guides/auth/row-level-security - Guest access patterns
- npm @liveblocks/react@3.13.4 - Package verification for current version
- npm @liveblocks/node@3.13.4 - Package verification for backend version
- npm color-hash@2.0.2 - String-to-color hashing library
- npm nanoid@5.0.9 - URL-friendly unique ID generation

### Secondary (MEDIUM confidence)
- Obsidian URI Protocol - https://help.obsidian.md/Advanced+topics/Using+obsidian+URI - Deep link format
- "Real-time Collaboration in React 2026" - Community patterns verification
- "Building Multiplayer Cursors with Liveblocks" - Tutorial verification

### Tertiary (LOW confidence)
- React avatar component libraries (shadcn/ui, KendoReact) - For avatar styling inspiration
- "Best practices for real-time UI" - General collaboration UX patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation verified, package versions confirmed
- Architecture: HIGH - Liveblocks provides official React patterns
- Pitfalls: HIGH - Based on documented common issues and best practices

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, but fast-moving library)
