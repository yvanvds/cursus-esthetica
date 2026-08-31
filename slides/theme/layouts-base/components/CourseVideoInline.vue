<!--
  Speler die het fragment op de slide zelf afspeelt, in plaats van fullscreen
  zoals CourseVideo. Bedoeld voor slides waar het beeld naast iets anders moet
  staan — een partituur, een tekstkolom — en waar wegklikken naar een overlay
  het punt kapotmaakt.

  Zelfde databron als CourseVideo: de timing komt uit videos.generated.json,
  dat `npm run sync:videos` uit de frontmatter van het hoofdstuk haalt. Zo staan
  YouTube-id en tijden op één plaats, in de cursustekst.

  Gebruik in een deck:  <CourseVideoInline id="meerstemmigheid/leonin" style="width: 60%;" />

  Afmeting komt van de aanroeper: geef `style` of `class` mee, die vallen door
  naar de wrapper. Zonder afmeting is het 100% breed op 16/9. Wil je een vaste
  hoogte (`height: 80%`), zet die dan op de wrapper — de iframe vult hem.
-->
<script setup lang="ts">
import { computed } from 'vue';
import videos from '../videos.generated.json';

interface VideoEntry {
  youtube: string;
  title: string;
  source: string;
  start?: number;
  end?: number;
  aspectRatio?: string;
}

const props = defineProps<{ id: string }>();

const video = computed<VideoEntry | undefined>(
  () => (videos as Record<string, VideoEntry>)[props.id],
);

// Geen autoplay: een slide die uit zichzelf begint te spelen zodra je erop
// belandt, neemt de les over. De docent drukt zelf op play.
const embedUrl = computed(() => {
  if (!video.value) return '';
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (video.value.start != null) params.set('start', String(video.value.start));
  if (video.value.end != null) params.set('end', String(video.value.end));
  return `https://www.youtube-nocookie.com/embed/${video.value.youtube}?${params}`;
});
</script>

<template>
  <div v-if="video" class="course-video-inline">
    <iframe
      class="course-video-inline__player"
      :src="embedUrl"
      :title="video.title"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
  </div>
  <span v-else class="course-video-inline__missing">
    Onbekend fragment: {{ id }}
  </span>
</template>

<style scoped>
.course-video-inline {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border: 1.5px solid var(--color-rule);
}

/* Absoluut gepositioneerd, zodat de iframe de wrapper vult of die nu zijn
   hoogte uit de aspect-ratio haalt of uit een meegegeven `height`. */
.course-video-inline__player {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.course-video-inline__missing {
  color: #b00;
  font-family: monospace;
  font-size: 0.8em;
}
</style>
