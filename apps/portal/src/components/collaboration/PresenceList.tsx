/**
 * Presence List Component
 *
 * Displays all active users in the current document with:
 * - Complete user list (not just counter) per locked decision
 * - Avatars with color-hash generated colors
 * - Typing indicator "digitando..." per locked decision
 * - Fade-in animation on user join per locked decision
 */

import React, { useState, useEffect } from "react";
import { useOthers, useSelf } from "@liveblocks/react";
import { getAvatarColor, getAvatarTextColor } from "../../lib/cursor-colors";
import type { UserPresence } from "./RoomProvider";

export interface PresenceListProps {
  className?: string;
  showCount?: boolean;
  maxVisible?: number;
}

/**
 * Individual user avatar with color and name
 */
interface UserAvatarProps {
  name: string;
  avatar?: string;
  isTyping?: boolean;
  isCurrentUser?: boolean;
  style?: React.CSSProperties;
}

function UserAvatar({ name, avatar, isTyping, isCurrentUser, style }: UserAvatarProps) {
  const color = getAvatarColor(name);
  const textColor = getAvatarTextColor(name);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative group"
      style={style}
      title={isCurrentUser ? `${name} (você)` : name}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover:scale-110"
        style={{ backgroundColor: color, color: textColor }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initials || "?"}</span>
        )}
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-600 dark:text-gray-400 whitespace-nowrap bg-white/90 dark:bg-gray-800/90 px-1 rounded shadow-sm animate-pulse">
          digitando...
        </span>
      )}

      {/* Current user badge */}
      {isCurrentUser && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" title="Você">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  );
}

/**
 * Fade-in animation wrapper for new users
 */
interface FadeInUserProps {
  children: React.ReactNode;
  delay?: number;
}

function FadeInUser({ children, delay = 0 }: FadeInUserProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(-8px)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Presence List Component
 *
 * Shows all users currently viewing the document with their avatars,
 * names, and typing status. Includes fade-in animations for new users.
 *
 * Features:
 * - Complete user list (avatars with names on hover)
 * - Consistent colors from username (color-hash)
 * - Typing indicator "digitando..."
 * - Fade-in animation when users join
 * - Current user highlighted with badge
 */
export function PresenceList({
  className = "",
  showCount = false,
  maxVisible = 8,
}: PresenceListProps) {
  const others = useOthers();
  const self = useSelf();

  // Get all users including self
  const allUsers = [
    ...(self ? [{ ...self, isCurrentUser: true }] : []),
    ...others.map((other) => ({ ...other, isCurrentUser: false })),
  ];

  // Track users for fade-in animation
  const [userIds, setUserIds] = useState<string[]>([]);

  useEffect(() => {
    const currentIds = allUsers.map((u) => u.connectionId);
    const newIds = currentIds.filter((id) => !userIds.includes(id));

    if (newIds.length > 0) {
      setUserIds([...userIds, ...newIds]);
    }
  }, [allUsers, userIds]);

  if (allUsers.length === 0) {
    return null;
  }

  const visibleUsers = allUsers.slice(0, maxVisible);
  const remainingCount = allUsers.length - maxVisible;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* User avatars with overlap */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => {
          const presence = user.presence as UserPresence;
          const isNew = !userIds.includes(user.connectionId);

          return (
            <FadeInUser key={user.connectionId} delay={isNew ? index * 50 : 0}>
              <UserAvatar
                name={presence?.name || "Anonymous"}
                avatar={presence?.avatar}
                isTyping={presence?.isTyping}
                isCurrentUser={user.isCurrentUser}
              />
            </FadeInUser>
          );
        })}

        {/* Show +N for remaining users */}
        {remainingCount > 0 && (
          <FadeInUser key="remaining" delay={visibleUsers.length * 50}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-help"
              title={`+${remainingCount} outros visualizando`}
            >
              +{remainingCount}
            </div>
          </FadeInUser>
        )}
      </div>

      {/* Count label (optional) */}
      {showCount && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {allUsers.length} {allUsers.length === 1 ? "pessoa" : "pessoas"} visualizando
        </span>
      )}
    </div>
  );
}

/**
 * Compact presence indicator showing only count and avatar stack
 *
 * Use this in tight spaces like toolbars or headers.
 */
export interface PresenceCompactProps {
  className?: string;
}

export function PresenceCompact({ className = "" }: PresenceCompactProps) {
  const others = useOthers();
  const self = useSelf();
  const totalCount = (self ? 1 : 0) + others.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      <PresenceList showCount={false} maxVisible={3} />
    </div>
  );
}

export default PresenceList;
