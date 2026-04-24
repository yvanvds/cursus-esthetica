import { visit } from 'unist-util-visit';
import path from 'node:path';
import type { Root, Link, Text } from 'mdast';

export function remarkFigureLinks() {
  return function (tree: Root, file: { path?: string; history?: string[] }) {
    let hasLinks = false;

    visit(tree, 'link', (node: Link, index: number | null, parent: any) => {
      const isVideo = node.url.startsWith('video:');
      const isFigure = node.url.startsWith('fig:');
      if ((!isVideo && !isFigure) || index == null || !parent) return;

      const labelText = node.children
        .filter((c): c is Text => c.type === 'text')
        .map(c => c.value)
        .join('');

      let jsxNode: any;

      if (isVideo) {
        const id = node.url.slice('video:'.length);
        jsxNode = {
          type: 'mdxJsxTextElement',
          name: 'FigureLink',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'id', value: id },
            { type: 'mdxJsxAttribute', name: 'type', value: 'video' },
            { type: 'mdxJsxAttribute', name: 'label', value: labelText },
          ],
          children: node.children,
        };
      } else {
        const raw = node.url.slice(4);
        const qIdx = raw.indexOf('?');
        const id = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
        const query = qIdx >= 0 ? raw.slice(qIdx + 1) : '';
        const iconName = new URLSearchParams(query).get('icon') ?? 'image';
        jsxNode = {
          type: 'mdxJsxTextElement',
          name: 'FigureLink',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'id', value: id },
            { type: 'mdxJsxAttribute', name: 'type', value: 'figure' },
            { type: 'mdxJsxAttribute', name: 'icon', value: `lucide:${iconName}` },
            { type: 'mdxJsxAttribute', name: 'label', value: labelText },
          ],
          children: node.children,
        };
      }

      parent.children[index] = jsxNode;
      hasLinks = true;
    });

    if (!hasLinks) return;

    const alreadyImported = (tree.children as any[]).some(
      n => n.type === 'mdxjsEsm' && (n.value as string | undefined)?.includes('FigureLink')
    );
    if (alreadyImported) return;

    const filePath = file.path ?? file.history?.[0] ?? '';
    const componentAbs = path.resolve(process.cwd(), 'src/components/base/FigureLink.astro');
    let importPath = filePath
      ? path.relative(path.dirname(filePath), componentAbs).replace(/\\/g, '/')
      : '../../components/base/FigureLink.astro';
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;

    const importNode: any = {
      type: 'mdxjsEsm',
      value: `import FigureLink from '${importPath}'`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: 'FigureLink' },
                },
              ],
              source: {
                type: 'Literal',
                value: importPath,
                raw: `'${importPath}'`,
              },
            },
          ],
        },
      },
    };

    tree.children.unshift(importNode);
  };
}
