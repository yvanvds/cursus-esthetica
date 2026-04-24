import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const text = toString(tree);
    const { minutes } = getReadingTime(text);
    const rounded = Math.max(1, Math.ceil(minutes));
    data.astro.frontmatter.readingTime = `≈ ${rounded} min lezen`;
  };
}
