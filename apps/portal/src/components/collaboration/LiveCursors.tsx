/**
 * Live Cursors Component
 *
 * Renders all other users' cursors in the document.
 */

import { useOthers } from "@liveblocks/react";
import { Cursor } from "./Cursor";
import { getCursorColor } from "@/lib/cursor-colors";

export function LiveCursors() {
  const others = useOthers();

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 1000 }}
    >
      {others
        .filter((other) => other.presence.cursor !== null)
        .map((other) => (
          <Cursor
            key={other.connectionId}
            x={(other.presence.cursor as { x: number; y: number }).x}
            y={(other.presence.cursor as { x: number; y: number }).y}
            color={getCursorColor(other.info.name as string)}
            name={other.info.name as string}
            isTyping={other.presence.isTyping as boolean | undefined}
            selection={other.presence.selection as CursorProps["selection"]}
          />
        ))}
    </svg>
  );
}

import type { CursorProps } from "./Cursor";
