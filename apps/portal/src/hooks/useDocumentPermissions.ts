/**
 * Document Permissions Hook
 *
 * Manages access permissions for shared documents.
 */

import { useState, useCallback } from 'react';

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'owner';

export interface UserPermission {
  userId: string;
  userName: string;
  userColor?: string;
  level: PermissionLevel;
  grantedAt: string;
  grantedBy: string;
}

export interface DocumentPermissions {
  documentId: string;
  ownerId: string;
  permissions: UserPermission[];
  isPublic: boolean;
}

export interface UseDocumentPermissionsOptions {
  documentId: string;
  initialPermissions?: DocumentPermissions;
  currentUserId?: string;
}

export interface UseDocumentPermissionsReturn {
  permissions: DocumentPermissions | null;
  userPermission: PermissionLevel | null;
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  isOwner: boolean;
  setPermission: (userId: string, level: PermissionLevel) => void;
  removePermission: (userId: string) => void;
  grantPublicAccess: () => void;
  revokePublicAccess: () => void;
  addUserPermission: (userId: string, level: PermissionLevel) => void;
}

const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  view: 1,
  comment: 2,
  edit: 3,
  owner: 4,
};

/**
 * Check if permission level grants access
 */
function hasPermission(userLevel: PermissionLevel | null, required: PermissionLevel): boolean {
  if (!userLevel) return false;
  return PERMISSION_HIERARCHY[userLevel] >= PERMISSION_HIERARCHY[required];
}

/**
 * Hook for managing document permissions
 */
export function useDocumentPermissions({
  documentId,
  initialPermissions,
  currentUserId,
}: UseDocumentPermissionsOptions): UseDocumentPermissionsReturn {
  const [permissions, setPermissions] = useState<DocumentPermissions | null>(
    initialPermissions || null
  );

  /**
   * Get current user's permission level
   */
  const userPermission = useCallback((): PermissionLevel | null => {
    if (!permissions || !currentUserId) return null;

    if (permissions.ownerId === currentUserId) return 'owner';

    const userPerm = permissions.permissions.find((p) => p.userId === currentUserId);
    return userPerm?.level || null;
  }, [permissions, currentUserId]);

  /**
   * Check permissions
   */
  const canView = useCallback((): boolean => {
    const level = userPermission();
    return level !== null || permissions?.isPublic || false;
  }, [userPermission, permissions]);

  const canComment = useCallback((): boolean => {
    const level = userPermission();
    return hasPermission(level, 'comment');
  }, [userPermission]);

  const canEdit = useCallback((): boolean => {
    const level = userPermission();
    return hasPermission(level, 'edit');
  }, [userPermission]);

  const isOwner = useCallback((): boolean => {
    return permissions?.ownerId === currentUserId || false;
  }, [permissions, currentUserId]);

  /**
   * Set user permission level
   */
  const setPermission = useCallback((userId: string, level: PermissionLevel) => {
    setPermissions((prev) => {
      if (!prev) return prev;

      const existing = prev.permissions.findIndex((p) => p.userId === userId);

      if (existing >= 0) {
        // Update existing
        const updated = [...prev.permissions];
        updated[existing] = {
          ...updated[existing],
          level,
          grantedAt: new Date().toISOString(),
        };
        return { ...prev, permissions: updated };
      } else {
        // Add new
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            {
              userId,
              userName: '', // Will be filled from user data
              level,
              grantedAt: new Date().toISOString(),
              grantedBy: currentUserId || '',
            },
          ],
        };
      }
    });
  }, [currentUserId]);

  /**
   * Remove user permission
   */
  const removePermission = useCallback((userId: string) => {
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        permissions: prev.permissions.filter((p) => p.userId !== userId),
      };
    });
  }, []);

  /**
   * Add user permission
   */
  const addUserPermission = useCallback((userId: string, level: PermissionLevel) => {
    setPermission(userId, level);
  }, [setPermission]);

  /**
   * Grant public access
   */
  const grantPublicAccess = useCallback(() => {
    setPermissions((prev) => {
      if (!prev) return prev;
      return { ...prev, isPublic: true };
    });
  }, []);

  /**
   * Revoke public access
   */
  const revokePublicAccess = useCallback(() => {
    setPermissions((prev) => {
      if (!prev) return prev;
      return { ...prev, isPublic: false };
    });
  }, []);

  return {
    permissions,
    userPermission,
    canView,
    canComment,
    canEdit,
    isOwner,
    setPermission,
    removePermission,
    grantPublicAccess,
    revokePublicAccess,
    addUserPermission,
  };
}

/**
 * Permission level descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
  view: 'Visualizar apenas - pode ver o documento e anotações',
  comment: 'Comentar - pode adicionar anotações',
  edit: 'Editar - pode modificar anotações e conteúdo',
  owner: 'Proprietário - controle total do documento',
};

export default useDocumentPermissions;
