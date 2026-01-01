export interface CalloutConfig {
  icon: string; // Nome do ícone (Lucide)
  color: string; // Cor CSS (variável ou hex)
  aliases?: string[]; // Tipos equivalentes
}

export const CALLOUT_TYPES: Record<string, CalloutConfig> = {
  // Nota/Informação
  note: {
    icon: 'pencil',
    color: 'var(--callout-color-note, #3b82f6)', // blue-500
    aliases: ['seealso'],
  },
  abstract: {
    icon: 'clipboard-list',
    color: 'var(--callout-color-abstract, #06b6d4)', // cyan-500
    aliases: ['summary', 'tldr'],
  },
  info: {
    icon: 'info',
    color: 'var(--callout-color-info, #3b82f6)', // blue-500
  },
  todo: {
    icon: 'check-circle-2',
    color: 'var(--callout-color-todo, #3b82f6)', // blue-500
  },

  // Dicas/Ajuda
  tip: {
    icon: 'flame',
    color: 'var(--callout-color-tip, #06b6d4)', // cyan-500
    aliases: ['hint', 'important'],
  },

  // Sucesso
  success: {
    icon: 'check',
    color: 'var(--callout-color-success, #22c55e)', // green-500
    aliases: ['check', 'done'],
  },

  // Perguntas
  question: {
    icon: 'help-circle',
    color: 'var(--callout-color-question, #f59e0b)', // amber-500
    aliases: ['help', 'faq'],
  },

  // Avisos
  warning: {
    icon: 'alert-triangle',
    color: 'var(--callout-color-warning, #f59e0b)', // amber-500
    aliases: ['caution', 'attention'],
  },

  // Erros
  failure: {
    icon: 'x',
    color: 'var(--callout-color-failure, #ef4444)', // red-500
    aliases: ['fail', 'missing'],
  },
  danger: {
    icon: 'zap',
    color: 'var(--callout-color-danger, #ef4444)', // red-500
    aliases: ['error'],
  },
  bug: {
    icon: 'bug',
    color: 'var(--callout-color-bug, #ef4444)', // red-500
  },

  // Exemplos
  example: {
    icon: 'list',
    color: 'var(--callout-color-example, #8b5cf6)', // purple-500
  },

  // Citações
  quote: {
    icon: 'quote',
    color: 'var(--callout-color-quote, #64748b)', // slate-500
    aliases: ['cite'],
  },
};

// Função para obter config com fallback para tipos customizados
export function getCalloutConfig(type: string): CalloutConfig {
  const normalizedType = type.toLowerCase();

  // Verificar se é tipo padrão
  if (CALLOUT_TYPES[normalizedType]) {
    return CALLOUT_TYPES[normalizedType];
  }

  // Verificar aliases
  for (const [key, config] of Object.entries(CALLOUT_TYPES)) {
    if (config.aliases?.includes(normalizedType)) {
      return config;
    }
  }

  // Fallback para tipos customizados
  return {
    icon: 'pencil', // ícone padrão
    color: 'var(--callout-color-custom, #64748b)', // slate-500
  };
}
