/**
 * Presence Indicator Component
 *
 * Shows active users in the current document with avatars.
 */

import React from 'react';
import { usePresence } from '../hooks/usePresence';
import type { PresenceUser } from '@obsidian-note-reviewer/collaboration/types';

export interface PresenceIndicatorProps {
  roomId: string;
  currentUserId?: string;
  enabled?: boolean;
}

/**
 * Displays real-time presence indicator showing other users viewing the document
 */
export function PresenceIndicator({
  roomId,
  currentUserId,
  enabled = true,
}: PresenceIndicatorProps) {
  const { others, connected } = usePresence({ roomId, enabled });

  if (!enabled || !connected || others.length === 0) {
    return null;
  }

  return (
    <div className="presence-indicator flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {others.length} {others.length === 1 ? 'outro' : 'outros'} visualizando
        </span>
      </div>

      {/* Avatars */}
      <div className="flex -space-x-2">
        {others.slice(0, 5).map((other) => (
          <UserAvatar key={other.id} user={other} />
        ))}

        {others.length > 5 && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 font-medium border-2 border-white dark:border-gray-800">
            +{others.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

interface UserAvatarProps {
  user: PresenceUser;
}

/**
 * Individual user avatar with color and initials/image
 */
function UserAvatar({ user }: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800 shadow-sm"
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </div>
  );
}

/**
 * Compact version showing only count
 */
export interface PresenceCountProps {
  roomId: string;
  enabled?: boolean;
}

export function PresenceCount({ roomId, enabled = true }: PresenceCountProps) {
  const { others, connected } = usePresence({ roomId, enabled });

  if (!enabled || !connected || others.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {others.length + 1}
      </span>
    </div>
  );
}

export default PresenceIndicator;
