/**
 * Permission Settings Component
 *
 * UI for managing document access permissions.
 */

import React, { useState } from 'react';
import { useDocumentPermissions, PERMISSION_DESCRIPTIONS, type PermissionLevel } from '../hooks/useDocumentPermissions';

export interface PermissionSettingsProps {
  documentId: string;
  ownerId: string;
  currentUserId?: string;
  onPermissionChange?: (userId: string, level: PermissionLevel) => void;
}

export function PermissionSettings({
  documentId,
  ownerId,
  currentUserId,
  onPermissionChange,
}: PermissionSettingsProps) {
  const {
    permissions,
    canEdit,
    isOwner,
    setPermission,
    removePermission,
    grantPublicAccess,
    revokePublicAccess,
  } = useDocumentPermissions({
    documentId,
    currentUserId,
  });

  const [newUserEmail, setNewUserEmail] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  // If user can't edit permissions, show access denied
  if (!isOwner && !canEdit) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center">
        <svg className="w-12 h-12 mx-auto text-yellow-600 dark:text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Você não tem permissão para alterar as configurações de acesso
        </p>
      </div>
    );
  }

  return (
    <div className="permission-settings space-y-6">
      {/* Public access toggle */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Acesso público
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Qualquer pessoas com o link podem visualizar
          </p>
        </div>
        <button
          onClick={() => permissions?.isPublic ? revokePublicAccess() : grantPublicAccess()}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors
            ${permissions?.isPublic ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
          `}
        >
          <span className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform
            ${permissions?.isPublic ? 'translate-x-6' : 'translate-x-1'}
          `} />
        </button>
      </div>

      {/* User permissions */}
      {isOwner && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Pessoas com acesso
          </h3>

          <div className="space-y-3">
            {permissions?.permissions.map((perm) => (
              <UserPermissionRow
                key={perm.userId}
                permission={perm}
                isOwner={perm.userId === ownerId}
                onChange={(level) => {
                  setPermission(perm.userId, level);
                  onPermissionChange?.(perm.userId, level);
                }}
                onRemove={() => removePermission(perm.userId)}
              />
            ))}
          </div>

          {/* Add user button */}
          {showAddUser ? (
            <div className="flex gap-2 mt-4">
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <button
                onClick={() => {
                  // Add user with view permission
                  const newUserId = `user-${Date.now()}`;
                  setPermission(newUserId, 'view');
                  onPermissionChange?.(newUserId, 'view');
                  setNewUserEmail('');
                  setShowAddUser(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUserEmail('');
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddUser(true)}
              className="w-full mt-4 px-4 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              + Adicionar pessoa
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface UserPermissionRowProps {
  permission: {
    userId: string;
    userName: string;
    level: PermissionLevel;
  };
  isOwner: boolean;
  onChange: (level: PermissionLevel) => void;
  onRemove: () => void;
}

function UserPermissionRow({ permission, isOwner, onChange, onRemove }: UserPermissionRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
        {permission.userName.charAt(0).toUpperCase()}
      </div>
      <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
        {permission.userName}
      </span>
      {!isOwner && (
        <select
          value={permission.level}
          onChange={(e) => onChange(e.target.value as PermissionLevel)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="view">Visualizar</option>
          <option value="comment">Comentar</option>
          <option value="edit">Editar</option>
        </select>
      )}
      {isOwner && (
        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
          Proprietário
        </span>
      )}
      {!isOwner && onRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remover acesso"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Compact permission selector
 */
export interface PermissionSelectorProps {
  value: PermissionLevel;
  onChange: (level: PermissionLevel) => void;
  disabled?: boolean;
}

export function PermissionSelector({ value, onChange, disabled }: PermissionSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PermissionLevel)}
      disabled={disabled}
      className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
    >
      <option value="view">Visualizar</option>
      <option value="comment">Comentar</option>
      <option value="edit">Editar</option>
    </select>
  );
}

export default PermissionSettings;
