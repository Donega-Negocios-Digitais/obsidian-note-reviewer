/**
 * SISTEMA DE MAPEAMENTO DE CAMINHOS E TEMPLATES
 *
 * Define a estrutura de pastas e templates para cada tipo de nota no Obsidian.
 * Baseado na estrutura do vault Alex Donega.
 */

export type TipoNota =
  // Conteúdo de Terceiros (Atlas/)
  | 'video_youtube'
  | 'artigo'
  | 'newsletter'
  | 'livro'
  | 'curso'
  | 'aula'
  | 'podcast'
  | 'palestra'
  | 'entrevista'

  // Notas Atômicas (Atlas/Atomos/)
  | 'atomica'
  | 'framework'
  | 'pessoa'
  | 'citacao'

  // Notas Organizacionais (Atlas/Mapas/)
  | 'moc'
  | 'dashboard'

  // Conteúdo Próprio Alex (Work/)
  | 'artigo_alex'
  | 'video_alex'
  | 'projeto'
  | 'tutorial'
  | 'conteudo_mestre'
  | 'roteiro';

export interface NotePathConfig {
  baseFolder: string;      // Atlas/ ou Work/
  subfolder: string;       // Conteudos/Video Youtube/
  template: string;        // template-video-youtube.md
  emoji: string;          // Emoji para UI
  label: string;          // Label descritivo
  category: 'terceiros' | 'atomica' | 'organizacional' | 'alex';
  defaultTemplatePath?: string;  // Caminho completo padrão do template
  defaultDestPath?: string;      // Caminho completo padrão do destino
}

const VAULT_BASE = 'C:/dev/obsidian-alexdonega';

/**
 * Mapeamento completo de todos os tipos de nota
 */
const NOTE_CONFIGS: Record<TipoNota, NotePathConfig> = {
  // ========== CONTEÚDO DE TERCEIROS ==========
  video_youtube: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Video Youtube',
    template: 'template-video-youtube.md',
    emoji: '📹',
    label: 'Video YouTube',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-video-youtube.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Video Youtube'
  },
  artigo: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Artigos',
    template: 'template-artigo.md',
    emoji: '📄',
    label: 'Artigo/Web',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-artigo.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Artigos'
  },
  newsletter: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Newsletters',
    template: 'template-newsletter.md',
    emoji: '📧',
    label: 'Newsletter',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-newsletter.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Newsletters'
  },
  livro: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Livros',
    template: 'template-livro.md',
    emoji: '📚',
    label: 'Livro',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-livro.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Livros'
  },
  curso: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Cursos',
    template: 'template-curso.md',
    emoji: '🎓',
    label: 'Curso',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-curso.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Cursos'
  },
  aula: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Aulas',
    template: 'template-aula.md',
    emoji: '🏫',
    label: 'Aula',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-aula.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Aulas'
  },
  podcast: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Podcasts',
    template: 'template-podcast.md',
    emoji: '🎙️',
    label: 'Podcast',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-podcast.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Podcasts'
  },
  palestra: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Palestras',
    template: 'template-palestra.md',
    emoji: '🎤',
    label: 'Palestra',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-palestra.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Palestras'
  },
  entrevista: {
    baseFolder: 'Atlas',
    subfolder: 'Conteudos/Entrevistas',
    template: 'template-entrevista.md',
    emoji: '🎬',
    label: 'Entrevista',
    category: 'terceiros',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-entrevista.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Entrevistas'
  },

  // ========== NOTAS ATÔMICAS ==========
  atomica: {
    baseFolder: 'Atlas',
    subfolder: 'Atomos/Conceitos',
    template: 'template-atomica.md',
    emoji: '⚛️',
    label: 'Conceito Atômico',
    category: 'atomica',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-atomica.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Átomos\\Conceitos'
  },
  framework: {
    baseFolder: 'Atlas',
    subfolder: 'Atomos/Frameworks',
    template: 'template-framework.md',
    emoji: '🗂️',
    label: 'Framework',
    category: 'atomica',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-framework.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Átomos\\Frameworks'
  },
  pessoa: {
    baseFolder: 'Atlas',
    subfolder: 'Atomos/Pessoas',
    template: 'template-pessoa.md',
    emoji: '👤',
    label: 'Pessoa',
    category: 'atomica',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-pessoa.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Átomos\\Pessoas'
  },
  citacao: {
    baseFolder: 'Atlas',
    subfolder: 'Atomos/Citacoes',
    template: 'template-citacao.md',
    emoji: '💬',
    label: 'Citação',
    category: 'atomica',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-citacao.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Átomos\\Citacoes'
  },

  // ========== NOTAS ORGANIZACIONAIS ==========
  moc: {
    baseFolder: 'Atlas',
    subfolder: 'Mapas',
    template: 'template-moc.md',
    emoji: '🗺️',
    label: 'MOC (Mapa)',
    category: 'organizacional',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-moc.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Mapas'
  },
  dashboard: {
    baseFolder: 'Atlas',
    subfolder: 'Mapas/Dashboards',
    template: 'template-dashboard.md',
    emoji: '📊',
    label: 'Dashboard',
    category: 'organizacional',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-dashboard.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Mapas'
  },

  // ========== CONTEÚDO PRÓPRIO (ALEX) ==========
  artigo_alex: {
    baseFolder: 'Work',
    subfolder: 'Conteudos Mestre',
    template: 'template-artigo-alex.md',
    emoji: '✍️',
    label: 'Meu Artigo',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas work\\template-artigo-alex.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Work\\Conteudos Mestre'
  },
  video_alex: {
    baseFolder: 'Work',
    subfolder: 'Conteudos Mestre',
    template: 'template-video-youtube-alex.md',
    emoji: '🎬',
    label: 'Meu Video',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas work\\template-video-youtube-alex.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Work\\Conteudos Mestre'
  },
  projeto: {
    baseFolder: 'Work',
    subfolder: 'Projetos',
    template: 'template-projeto.md',
    emoji: '🚀',
    label: 'Projeto',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-projeto.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Work\\Projetos'
  },
  tutorial: {
    baseFolder: 'Work',
    subfolder: 'Tutoriais',
    template: 'template-tutorial.md',
    emoji: '📖',
    label: 'Tutorial',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas conteúdo\\template-tutorial.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Atlas\\Conteúdos\\Tutoriais'
  },
  conteudo_mestre: {
    baseFolder: 'Work',
    subfolder: 'Conteudos Mestre',
    template: 'template-conteudo-mestre.md',
    emoji: '🎯',
    label: 'Conteúdo Mestre',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas work\\template-conteudo-mestre.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Work\\Conteudos Mestre'
  },
  roteiro: {
    baseFolder: 'Work',
    subfolder: 'Roteiros',
    template: 'template-roteiro.md',
    emoji: '📝',
    label: 'Roteiro',
    category: 'alex',
    defaultTemplatePath: 'C:\\dev\\obsidian-alexdonega\\Sistema\\Templates\\Templates de notas work\\template-roteiro.md',
    defaultDestPath: 'C:\\dev\\obsidian-alexdonega\\Work\\Roteiros'
  }
};

/**
 * Retorna a configuração para um tipo de nota
 */
export function getNotePathConfig(tipo: TipoNota): NotePathConfig {
  return NOTE_CONFIGS[tipo];
}

/**
 * Constrói o caminho completo onde a nota será salva
 */
export function buildFullPath(tipo: TipoNota, filename: string): string {
  const config = getNotePathConfig(tipo);

  // Garantir que filename termina com .md
  const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

  return `${VAULT_BASE}/${config.baseFolder}/${config.subfolder}/${finalFilename}`;
}

/**
 * Retorna o caminho completo do template
 */
export function getTemplatePath(tipo: TipoNota): string {
  const config = getNotePathConfig(tipo);

  const templateBase = config.category === 'alex'
    ? `${VAULT_BASE}/Sistema/Templates/Templates de notas work`
    : `${VAULT_BASE}/Sistema/Templates/Templates de notas conteúdo`;

  return `${templateBase}/${config.template}`;
}

/**
 * Agrupa tipos de nota por categoria para UI
 */
export function getNoteTypesByCategory() {
  return {
    terceiros: Object.entries(NOTE_CONFIGS)
      .filter(([_, config]) => config.category === 'terceiros')
      .map(([tipo, config]) => ({ tipo: tipo as TipoNota, ...config })),

    atomica: Object.entries(NOTE_CONFIGS)
      .filter(([_, config]) => config.category === 'atomica')
      .map(([tipo, config]) => ({ tipo: tipo as TipoNota, ...config })),

    organizacional: Object.entries(NOTE_CONFIGS)
      .filter(([_, config]) => config.category === 'organizacional')
      .map(([tipo, config]) => ({ tipo: tipo as TipoNota, ...config })),

    alex: Object.entries(NOTE_CONFIGS)
      .filter(([_, config]) => config.category === 'alex')
      .map(([tipo, config]) => ({ tipo: tipo as TipoNota, ...config }))
  };
}

/**
 * Retorna todos os tipos de nota disponíveis
 */
export function getAllNoteTypes(): TipoNota[] {
  return Object.keys(NOTE_CONFIGS) as TipoNota[];
}

/**
 * Valida se um tipo de nota é válido
 */
export function isValidNoteType(tipo: string): tipo is TipoNota {
  return tipo in NOTE_CONFIGS;
}

/**
 * Retorna todos os valores padrão de templates e destinos
 */
export function getDefaultConfigs(): {
  templates: Record<string, string>;
  paths: Record<string, string>;
} {
  const templates: Record<string, string> = {};
  const paths: Record<string, string> = {};

  Object.entries(NOTE_CONFIGS).forEach(([tipo, config]) => {
    if (config.defaultTemplatePath) {
      templates[tipo] = config.defaultTemplatePath;
    }
    if (config.defaultDestPath) {
      paths[tipo] = config.defaultDestPath;
    }
  });

  return { templates, paths };
}
