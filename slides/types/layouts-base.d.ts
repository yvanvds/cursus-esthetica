/**
 * Attributes that layouts-base itself reads from the DOM, declared for
 * `npm run check:vue` (strictTemplates rejects an undeclared attribute binding,
 * even a `data-*` one). The build never sees this file.
 *
 * `data-magnify-source="i"` marks the element in a slide where image i of a
 * `magnify` layout stands in the overview; `parts/MagnifyLayer.vue` measures it
 * as the start and end point of the zoom (#170).
 */
import 'vue';

declare module 'vue' {
  interface HTMLAttributes {
    'data-magnify-source'?: number | string;
  }
}
