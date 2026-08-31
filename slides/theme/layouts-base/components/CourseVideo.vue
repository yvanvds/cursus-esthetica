<!--
  Klikbare titel die een fragment fullscreen afspeelt, met dezelfde start- en
  eindtijd als in de cursustekst. De timing komt uit videos.generated.json, dat
  `npm run sync:videos` uit de frontmatter van het hoofdstuk haalt.

  Gebruik in een deck:  <CourseVideo id="inleiding/beethoven" label="Beethoven, 5e symfonie" />
  Laat `label` weg en de titel uit de cursustekst wordt gebruikt.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import videos from '../videos.generated.json';

interface VideoEntry {
  youtube: string;
  title: string;
  source: string;
  start?: number;
  end?: number;
  aspectRatio?: string;
}

const props = defineProps<{ id: string; label?: string }>();

const video = computed<VideoEntry | undefined>(
  () => (videos as Record<string, VideoEntry>)[props.id],
);
const open = ref(false);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const embedUrl = computed(() => {
  if (!video.value) return '';
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', autoplay: '1' });
  if (video.value.start != null) params.set('start', String(video.value.start));
  if (video.value.end != null) params.set('end', String(video.value.end));
  return `https://www.youtube-nocookie.com/embed/${video.value.youtube}?${params}`;
});

const caption = computed(() => {
  if (!video.value) return '';
  const { title, start, end } = video.value;
  if (start != null && end != null) return `${title} — Fragment ${formatTime(start)} — ${formatTime(end)}`;
  if (start != null) return `${title} — Vanaf ${formatTime(start)}`;
  return title;
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    open.value = false;
  }
}

// Slidev luistert zelf naar pijltjes en spatie; zolang de overlay openstaat mag
// een toetsaanslag niet ook de presentatie doorbladeren.
function swallowKeys(e: KeyboardEvent) {
  if (e.key !== 'Escape') e.stopPropagation();
}

watch(open, isOpen => {
  if (isOpen) {
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', swallowKeys, true);
  } else {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', swallowKeys, true);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('keyup', swallowKeys, true);
});
</script>

<template>
  <button
    v-if="video"
    type="button"
    class="course-video__trigger"
    @click="open = true"
  >
    <span class="course-video__icon" aria-hidden="true">▶</span>
    <span>{{ label ?? video.title }}</span>
  </button>
  <span v-else class="course-video__missing">
    Onbekend fragment: {{ id }}
  </span>

  <Teleport to="body">
    <div
      v-if="open"
      class="course-video__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Video bekijken"
      @click.self="open = false"
    >
      <div class="course-video__inner">
        <iframe
          class="course-video__player"
          :src="embedUrl"
          :title="video?.title"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
        <div class="course-video__caption">
          <span>{{ caption }}</span>
          <span class="course-video__source">{{ video?.source }}</span>
        </div>
      </div>
      <button
        type="button"
        class="course-video__close"
        aria-label="Sluit video"
        @click="open = false"
      >
        ✕
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.course-video__trigger {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid currentColor;
  opacity: 0.9;
}

.course-video__trigger:hover,
.course-video__trigger:focus-visible {
  opacity: 1;
  color: var(--slidev-theme-primary, currentColor);
}

.course-video__icon {
  font-size: 0.7em;
}

.course-video__missing {
  color: #b00;
  font-family: monospace;
  font-size: 0.8em;
}

.course-video__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
}

.course-video__inner {
  display: flex;
  flex-direction: column;
  width: min(90vw, 160vh);
}

.course-video__player {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  background: #000;
  display: block;
}

.course-video__caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 0.6rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
}

.course-video__source {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  flex-shrink: 0;
}

.course-video__close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  background: none;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  line-height: 1;
}

.course-video__close:hover,
.course-video__close:focus-visible {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.55);
}
</style>
