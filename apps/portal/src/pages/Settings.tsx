/**
 * Settings Page
 *
 * Main settings page with Apple-style design.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsLayout } from '../components/SettingsLayout';
import { SettingsSection, SettingsToggle, SettingsItem } from '../components/SettingsItem';

export function Settings() {
  return (
    <SettingsLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/general" replace />} />
        <Route path="/general" element={<GeneralSettings />} />
        <Route path="/appearance" element={<AppearanceSettings />} />
        <Route path="/annotations" element={<AnnotationsSettings />} />
        <Route path="/integration" element={<IntegrationSettings />} />
        <Route path="/about" element={<AboutSettings />} />
      </Routes>
    </SettingsLayout>
  );
}

function GeneralSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Geral
      </h2>

      <SettingsSection>
        <SettingsToggle
          label="Notificações"
          description="Receber notificações sobre atualizações e mudanças"
          checked={true}
          onChange={() => {}}
          icon="🔔"
        />
        <SettingsToggle
          label="Som de notificação"
          description="Tocar som ao receber notificações"
          checked={false}
          onChange={() => {}}
          icon="🔊"
        />
      </SettingsSection>

      <SettingsSection title="Idioma">
        <SettingsItem
          title="Idioma"
          description="Selecione o idioma da interface"
          icon="🌐"
          action={
            <select className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white">
              <option>Português (Brasil)</option>
              <option>English</option>
              <option>Español</option>
            </select>
          }
        />
      </SettingsSection>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Aparência
      </h2>

      <SettingsSection>
        <SettingsItem
          title="Tema"
          description="Escolha o tema da aplicação"
          icon="🎨"
          action={
            <select className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white">
              <option>Claro</option>
              <option>Escuro</option>
              <option>Automático (Sistema)</option>
            </select>
          }
        />
      </SettingsSection>

      <SettingsSection title="Cores de destaque">
        <SettingsItem
          title="Cor de destaque"
          description="Cor usada para elementos interativos"
          icon="💙"
          action={
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-600" />
              <button className="w-8 h-8 rounded-full bg-purple-600" />
              <button className="w-8 h-8 rounded-full bg-green-600" />
              <button className="w-8 h-8 rounded-full bg-orange-600" />
            </div>
          }
        />
      </SettingsSection>
    </div>
  );
}

function AnnotationsSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Anotações
      </h2>

      <SettingsSection>
        <SettingsToggle
          label="Auto-save"
          description="Salvar anotações automaticamente enquanto você edits"
          checked={true}
          onChange={() => {}}
          icon="💾"
        />
        <SettingsToggle
          label="Mostrar números de linha"
          description="Exibir números de linha no editor"
          checked={false}
          onChange={() => {}}
          icon="🔢"
        />
      </SettingsSection>

      <SettingsSection title="Local de salvamento">
        <SettingsItem
          title="Salvar em"
          description="Onde suas anotações são salvas"
          icon="📁"
          action={
            <select className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white">
              <option>Vault do Obsidian</option>
              <option>Nuvem</option>
              <option>Ambos</option>
            </select>
          }
        />
      </SettingsSection>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Integração
      </h2>

      <SettingsSection>
        <SettingsItem
          title="Claude Code"
          description="Configurar integração com Claude Code"
          icon="🤖"
          action={
            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Configurar
            </button>
          }
        />
        <SettingsToggle
          label="Hook automático"
          description="Abrir revisor automaticamente ao criar nota"
          checked={true}
          onChange={() => {}}
          icon="⚡"
        />
      </SettingsSection>
    </div>
  );
}

function AboutSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Sobre
      </h2>

      <SettingsSection>
        <SettingsItem
          title="Versão"
          description="Obsidian Note Reviewer"
          icon="ℹ️"
          action={
            <span className="text-sm text-gray-500 dark:text-gray-400">
              v1.0.0
            </span>
          }
        />
        <SettingsItem
          title="Licença"
          description="MIT License"
          icon="📜"
        />
      </SettingsSection>

      <SettingsSection title="Links">
        <SettingsItem
          title="GitHub"
          description="Código fonte e issues"
          icon="🔗"
          action={
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Abrir
            </a>
          }
        />
        <SettingsItem
          title="Documentação"
          description="Guia de uso e API"
          icon="📚"
          action={
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Abrir
            </a>
          }
        />
      </SettingsSection>
    </div>
  );
}

export default Settings;
