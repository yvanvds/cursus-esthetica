/**
 * Type declaration for `@slidev/client`, used only by `npm run check:vue`
 * (mapped through `compilerOptions.paths` in `slides/tsconfig.json`). The
 * build never sees this file: Vite resolves `@slidev/client` to the real
 * package.
 *
 * Why not the package's own types: `@slidev/client` ships raw `.ts` source,
 * and its entry pulls in the whole client (`useNav`, `useClicks`, `env`, ...).
 * That source only type-checks inside Slidev's own monorepo — it relies on
 * build-time globals (`__DEV__`, `__SLIDEV_HAS_SERVER__`, ...), on an untyped
 * `file-saver`, and on a `@ts-expect-error` that is unused anywhere else.
 * Loading it here gives 34 errors, all in `node_modules/`, none in our own
 * code (Slidev 52.15).
 *
 * So this file declares the part of the public API the layouts use, with the
 * real types from `@slidev/types` (a proper `.d.ts` package). The shape of
 * `useSlideContext()` is copied from what TypeScript infers for
 * `@slidev/client/context.ts` in Slidev 52.15. `$slidev` and `$nav` are left
 * out: their types exist only in that source. Does a layout need another
 * export (`onSlideEnter`, `useNav`, `$nav`), add it here; a missing export
 * fails the check loudly, so nothing slips through unnoticed.
 */
import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types';
import type { ComputedRef, DefineComponent, Directive, Ref, ShallowUnwrapRef } from 'vue';

export interface SlideContext {
  $clicksContext: ClicksContext;
  $clicks: Ref<number>;
  $page: Ref<number>;
  $route: SlideRoute | undefined;
  $renderContext: Ref<RenderContext>;
  $frontmatter: Record<string, any>;
  $scale: Ref<number>;
  $zoom: ComputedRef<number>;
}

export function useSlideContext(): SlideContext;

declare module 'vue' {
  /* Mirrors `@slidev/client/shim-vue.d.ts`: Slidev exposes the slide context
     as globals in every template (`$clicks`, `$frontmatter`, ...). */
  interface ComponentCustomProperties extends ShallowUnwrapRef<SlideContext> {}

  /* Slidev registers its directives and built-in components globally, so a
     layout uses them without importing. `strictTemplates` in
     `slides/tsconfig.json` rejects any directive, component or prop it cannot
     find — that is the point: at runtime a typo such as `v-clik` or
     `<v-clickz>` only logs a console warning and renders nothing, without a
     build error. Only what the layouts use is declared here; using another
     Slidev built-in (`v-after`, `v-mark`, `<Arrow>`) means adding one line
     below. */
  interface GlobalDirectives {
    vClick: Directive<Element, unknown>;
  }

  interface GlobalComponents {
    VClicks: DefineComponent<{
      depth?: string | number;
      every?: string | number;
      at?: string | number;
      hide?: boolean;
      fade?: boolean;
    }>;
  }
}
