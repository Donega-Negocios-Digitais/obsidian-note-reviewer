import { describe, test, expect } from 'bun:test';
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../parser';

describe('parseMarkdownToBlocks', () => {
  test('detecta frontmatter YAML válido', () => {
    const markdown = `---
title: Test Note
tags: [test, example]
---

# Heading

Content here.`;

    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[0].content).toContain('title: Test Note');
    expect(blocks[0].content).toContain('tags: [test, example]');
  });

  test('ignora --- se não houver fechamento', () => {
    const markdown = `---
title: Incomplete

# Heading`;

    const blocks = parseMarkdownToBlocks(markdown);

    // Primeiro bloco NÃO deve ser frontmatter
    expect(blocks[0].type).not.toBe('frontmatter');
  });

  test('processa frontmatter vazio', () => {
    const markdown = `---
---

# Heading`;

    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[0].content.trim()).toBe('');
  });

  test('preserva ordem dos blocos após frontmatter', () => {
    const markdown = `---
title: Test
---

# Heading
Paragraph
## Subheading`;

    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[1].type).toBe('heading');
    expect(blocks[2].type).toBe('paragraph');
    expect(blocks[3].type).toBe('heading');
  });
});

describe('serializeBlocksToMarkdown', () => {
  test('preserva heading ao reconstruir markdown', () => {
    const markdown = `# Titulo principal

Texto de apoio.`;

    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized).toContain('# Titulo principal');
    expect(serialized).toContain('Texto de apoio.');
  });

  test('mantem frontmatter e bloco de codigo', () => {
    const markdown = `---
title: Teste
---

\`\`\`ts
console.log('ok');
\`\`\``;

    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized).toContain('---\ntitle: Teste\n---');
    expect(serialized).toContain('```ts');
    expect(serialized).toContain("console.log('ok');");
    expect(serialized).toContain('```');
  });

  test('preserva lista ordenada ao serializar', () => {
    const markdown = `# Passos

1. Primeiro item
2. Segundo item`;

    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized).toContain('1. Primeiro item');
    expect(serialized).toContain('2. Segundo item');
    expect(serialized).not.toContain('- Primeiro item');
  });
});
