import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CSSProperties, Ref } from 'vue';
import { useSlideContext } from '@slidev/client';

const SITE_BASE = '/cursus-esthetica';

/**
 * Resolved asset URL for layout `image` props. Verschilt van Slidev's
 * standaard-resolver doordat paden die al absoluut zijn t.o.v. de site
 * (`/cursus-esthetica/...`) ongewijzigd doorgegeven worden i.p.v. nog
 * eens de deck-base ervoor te krijgen.
 */
export function resolveAsset(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  if (path.startsWith(SITE_BASE + '/') || path === SITE_BASE) return path;
  if (path.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/';
    return base.replace(/\/$/, '') + path;
  }
  return path;
}

/**
 * Mirror van Slidev's eigen `handleBackground`, maar via `resolveAsset` zodat
 * `/cursus-esthetica/...`-paden niet dubbel-geprefixed worden.
 */
export function handleBackground(
  background?: string,
  dim = false,
  backgroundSize = 'cover',
): CSSProperties {
  const isColor = !!background && (background.startsWith('#') || background.startsWith('rgb'));
  let backgroundImage: string | undefined;
  if (background && !isColor) {
    const url = `url("${resolveAsset(background)}")`;
    backgroundImage = dim ? `linear-gradient(#0005, #0008), ${url}` : url;
  }
  const style: CSSProperties = {
    background: isColor ? background : undefined,
    color: background && !isColor ? 'white' : undefined,
    backgroundImage,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize,
  };
  if (!style.background) delete style.background;
  return style;
}

/**
 * De werkelijk weergegeven rechthoek van een beeld dat met
 * `object-fit: contain` in een podium (`stage`) gepast is.
 *
 * Waarom dit bestaat: `max-height: 100%` op een <img> in een figure met
 * automatische hoogte grijpt niet — die procentuele waarde heeft geen
 * definitieve hoogte om tegen op te lossen. Het beeld wordt dan alleen in
 * breedte begrensd en puilt onder zijn eigen frame uit, terwijl een overlay of
 * bijschrift dat op het frame steunt (`inset: 0`, `bottom: 0`) het te kleine
 * frame volgt. Dat is precies wat er misging in `vanishing-point` (#77) en
 * daarna in `raking` en `dimmer` (#92).
 *
 * De remedie is overal dezelfde: laat het beeld het podium vullen met
 * `width/height: 100%; object-fit: contain`, en reken uit de natuurlijke
 * afmetingen uit welk deel van het podium het beeld écht dekt. Die doos
 * (`box`, in px t.o.v. het podium) krijgt een absoluut gepositioneerd frame,
 * en dat frame draagt de overlay en het bijschrift. Zo kunnen beeld en frame
 * per constructie niet meer uit elkaar lopen.
 *
 * Gebruik:
 *   const stage = ref<HTMLElement | null>(null)
 *   const { onImageLoad, box, boxStyle } = useContainBox(stage)
 *
 *   <div ref="stage" style="position: relative; width: 100%; height: 100%">
 *     <img :src="src" @load="onImageLoad"
 *          style="width: 100%; height: 100%; object-fit: contain" />
 *     <figure :style="boxStyle" style="position: absolute">…</figure>
 *   </div>
 *
 * Zolang het beeld of het podium nog geen maten heeft, is `box` het hele
 * podium — dan staat het frame in elk geval niet op een verkeerde plek.
 * `vanishing-point` draagt nog zijn eigen kopie van deze logica; die migratie
 * is een aparte issue.
 */
export function useContainBox(stage: Ref<HTMLElement | null>) {
  const stageW = ref(0);
  const stageH = ref(0);
  const natW = ref(0);
  const natH = ref(0);

  let observer: ResizeObserver | null = null;

  onMounted(() => {
    if (!stage.value) return;
    observer = new ResizeObserver(([entry]) => {
      stageW.value = entry.contentRect.width;
      stageH.value = entry.contentRect.height;
    });
    observer.observe(stage.value);
  });

  onBeforeUnmount(() => observer?.disconnect());

  /** Aan de `@load` van de <img> hangen; leest de natuurlijke afmetingen. */
  function onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    natW.value = img.naturalWidth;
    natH.value = img.naturalHeight;
  }

  /** De beeldrechthoek in px t.o.v. het podium. */
  const box = computed(() => {
    if (!stageW.value || !stageH.value || !natW.value || !natH.value)
      return { left: 0, top: 0, width: stageW.value, height: stageH.value };
    const scale = Math.min(stageW.value / natW.value, stageH.value / natH.value);
    const width = natW.value * scale;
    const height = natH.value * scale;
    return {
      left: (stageW.value - width) / 2,
      top: (stageH.value - height) / 2,
      width,
      height,
    };
  });

  /** Dezelfde rechthoek als inline style voor een absoluut gepositioneerd frame. */
  const boxStyle = computed<CSSProperties>(() => ({
    left: `${box.value.left}px`,
    top: `${box.value.top}px`,
    width: `${box.value.width}px`,
    height: `${box.value.height}px`,
  }));

  return { onImageLoad, box, boxStyle };
}

/** Volgnummer voor de registratiesleutel van `useOwnClicks`. */
let ownClicksSeq = 0;

/**
 * Registreert `count` klikken voor een layout die zelf op `$clicks` stapt.
 *
 * Waarom dit bestaat: Slidev telt de klikken van een slide niet uit wat een
 * layout met `$clicks` dóét, maar uit wat er bij de clicks-context van die
 * slide geregistreerd staat. Normaal doet de `v-click`-directive dat bij
 * mount. Een layout zonder `v-click` in zijn template — `dimmer`, `breathe` —
 * registreert niets, dus is het kliktotaal nul, klemt Slidev `$clicks` op nul
 * en gaat de pijltjestoets meteen naar de volgende slide. Geen buildfout, geen
 * waarschuwing; de stappen worden gewoon nooit getoond (#93).
 *
 * De registratie gebeurt zoals `v-click` het zelf doet: `calculateSince(1, n)`
 * levert dezelfde `ClicksInfo` als een `v-click="1"` dat `n` klikken beslaat
 * (absoluut, dus `delta: 0` — de relatieve offsets van eventuele `v-click`s in
 * de slot-inhoud verschuiven er niet door), en `register` zet daarvan `max`
 * in de telling. De sleutel is een string per instantie, want de overview, de
 * presenter-modus en de volgende-slide-preview renderen de layout elk nog een
 * keer, elk tegen een eigen context; bij unmount wordt de registratie weer
 * opgeruimd zodat een oude instantie de telling niet vervuilt.
 *
 * `count` mag reactief zijn (HMR op de frontmatter). Bij 0 wordt niets
 * geregistreerd — een dimmer met één stap is dan gewoon een stilstaand beeld.
 *
 * Gebruik, in een layout die `useSlideContext()` al aanroept:
 *   useOwnClicks(() => Math.max(props.steps.length - 1, 0))
 */
export function useOwnClicks(count: () => number): void {
  const { $clicksContext } = useSlideContext();
  const key = `own-clicks-${++ownClicksSeq}`;

  watch(
    count,
    (n) => {
      if (n > 0) $clicksContext.register(key, $clicksContext.calculateSince(1, n));
      else $clicksContext.unregister(key);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => $clicksContext.unregister(key));
}
