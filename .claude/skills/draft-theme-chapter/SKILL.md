---
name: draft-theme-chapter
description: "Use this skill when the user wants to convert old course material (a OneNote dump, PDF export, or PowerPoint) into a new MDX chapter for the Cursus Esthetica site, *with substantial rewriting in the project's voice*. Triggers on phrases like \"zet deze cursustekst om naar mdx\", \"schrijf hoofdstuk X uit\", \"plak van onenote, maak er een hoofdstuk van\", \"convert this chapter\", \"rewrite this old chapter for the site\", or when the user pastes/attaches a long brok cursustekst and asks for an MDX hoofdstuk in return. Distinct from `add-interactive-component` (which builds widgets) — this skill produces the chapter prose, frontmatter, and image/video research."
---
 
# Draft theme chapter from old material
 
This skill converts existing course material into an MDX chapter that holds its own next to `inleiding.mdx` and `perspectief-en-ruimte.mdx`. The conversion is *not* a translation. The old text supplies the conceptual scaffolding and the cast of works; the new text is rewritten in the project's voice, with examples vetted (and often replaced), images researched fresh, and **every factual claim independently verified through web research** — old course material is a starting point, not a source of truth.
 
Read the canonical references before starting:
 
- `src/content/themes/inleiding.mdx`
- `src/content/themes/perspectief-en-ruimte.mdx`
- `docs/REDACTIE.md` — inhoudelijke afspraken (welke voorbeelden wel/niet) die niet uit de tekstbestanden af te leiden zijn
Do NOT use `smaak-klasse-macht.mdx` as a length reference — it overshoots. Use it only for tone in polemical passages.
 
### Werkplek
 
De skill draait in de repo-root. Schrijf alle prose — initiële MDX, snoei, latere revisies — rechtstreeks naar `src/content/themes/<slug>.mdx`. Beelden landen onder `public/images/<theme-id>/`.
 
## What the voice is doing (and what to imitate)
 
Read the two canonical chapters and notice the *moves*, not the prose. The skill enforces the moves; it does not enforce specific phrasings or closing patterns.
 
- **Concrete opening, no abstract intro.** First paragraph anchors in a specific event, year, or place — Cattelan's banana, Cimabue's throne, a Bulgarian choir. The thesis comes after the image, never before.
- **Throughline question in the title.** Titles like "Maar is het kunst?" or "Wie mag in het midden staan?" are not labels — they are questions the chapter answers (or refuses to answer). Pick the title last, after the skeleton is settled.
- **Accumulation, not exposition.** Three or four parallel cases stacked, then synthesised. Resist the urge to "explain the concept first, then give examples."
- **Critical undertow as analysis, not decoration — maar niet als default-essentie.** Who looks, who decides, who owns infrastructure: weave it in at the structural level where the subject invites it, never as an appended "diversity" paragraph. Gebruikersfeedback (juni 2026): niet elk hoofdstuk mag uitkomen bij "wie betaalt, wie wordt uitgebuit" — dat wordt voorspelbaar en doet de kunstvorm tekort. Kies per hoofdstuk bewust het register (soms is fascinatie, techniek, vorm of poëzie de kern, met kritiek hooguit als bijstem) en kies voorbeelden primair op artistieke merite. Toets bij het skelet: draagt dit voorbeeld bij aan het verhaal over de kunstvorm, of alleen aan de kritiek?
- **High–low and cross-era mixing where it serves the argument.** Bach next to Aphex Twin, icon next to TikTok-filter — but only when the chapter actually benefits. A cross-cultural counterweight is a frequent move, not a per-chapter requirement; not every subject lends itself to it. When you find one through research, use it.
- **Reader is addressed directly with "je".** At least once per chapter, the text reframes what the reader is doing — provocation, challenge, or recognition.
What you are NOT trying to do:
 
- Reproduce specific structural devices that happen in one chapter (e.g. inleiding's "Drie vragen" closing, perspectief's `<RegimeSection>` framing). These are not signatures — they are local solutions. Imitating them across chapters makes the cursus feel formulaic.
- Match the prose of `inleiding.mdx` line-by-line. The verification step at the end of this skill checks for *moves*, not for prose similarity, exactly to prevent homogenisation.
## Three-phase workflow
 
The skill runs in three phases. Each phase ends with a hard stop. Do not bleed into the next phase without explicit user confirmation.
 
### Phase 1 — Ontleding, research, skelet
 
Phase 1 has three sub-steps. Sub-steps 1a and 1b run in sequence; 1c can only start once both are complete.
 
#### 1a. Ontleding van het oude materiaal
 
Input: the old material (paste, attached PDF, or attached `.pptx`).
 
Preferred input format, in order: (1) `.pptx` — extractable images via the `pptx` skill; (2) PDF export from OneNote — readable via the `Read` tool, images embedded; (3) plain text paste — works but loses imagery.
 
1. **Read the old material end to end.** Do not skim. Identify what the source actually argues vs. what it merely lists. Old course material is often structured as a chronological survey; the new chapter must find a *thematic throughline* underneath.
2. **List every artwork, video, person, date, anecdote, or claim** in the old material. Mark each: *needs verification* (most things), *known canon* (Mona Lisa is in the Louvre, you don't need to verify that), or *suspect* (anything that sounds too neat — old course notes routinely garble dates, attribute quotes incorrectly, or repeat folk wisdom).
#### 1b. Externe research — verplicht voor elke nieuwe hoofdstuk
 
Old material is a starting point; it is not a source. Even when claims sound right, the LLM's training data is patchy and outdated, and the old text was often compiled from secondary sources. Treat the conversation up to this point as untrustworthy on facts. Use `WebSearch` and `WebFetch` to:
 
1. **Verify every "needs verification" item** from 1a. Dates, names, attributions, quotes, anecdotes. Note any that turn out to be wrong, garbled, or oversimplified — these become editorial decisions for Phase 1c.
2. **Surface scholarly framings** the old material misses. Search for the strongest contemporary argument about each candidate work or theme. The old text often presents one received reading; the literature usually has sharper or more polemical takes that fit the project's voice better.
3. **Look for adjacent material.** Cross-cultural counterparts, low-culture echoes, contemporary parallels, video/audio anchors. Don't force a cross-cultural pivot if the chapter doesn't naturally invite one — but research often surfaces them, and they tend to strengthen the argument when present.
4. **Identify video and audio candidates.** A short documentary, a virtuoso performance, a museum walkthrough, a talk. Many beats are stronger with a video alongside the still image. Don't reserve video research for Phase 2 — surface candidates here, alongside the example list.
5. **Keep a running source list.** Every fact you verify, every framing you borrow, every counter-example you add — note the URL. This list is part of the Phase 1 deliverable to the user, and ends up at the bottom of the finished chapter as a `## Bronnen` section. The list also lets the user fact-check the skeleton before you write 200 lines of prose on top of it.
#### 1c. Skelet
 
Now and only now, propose the chapter:
 
1. **Throughline question.** One sentence, phrased as a question the chapter answers. Test it against the candidate examples (kept + research-added) — if it doesn't pull them into a coherent argument, the question is wrong.
2. **Section skeleton.** Section headers as either questions or tight phrases (no academic labels like "1.2 Historische context"). For each section: one-line beat, the example(s) it leans on, what the section accomplishes in the larger arc.
3. **Examples table.** For each example: keep / replace / drop / add, with one-line reason. "Add" entries should reference the research that surfaced them.
4. **Length budget — in woorden, niet in regels.** De Astro-site rekent met ongeveer 190 woorden per minuut (de Astro reading-time plugin). Bepaal eerst met de gebruiker de doel-leestijd; vermenigvuldig met 190 voor het woord-budget van de body-prose (exclusief frontmatter, MDX-imports en de Bronnen-sectie). Richtwaardes: 12 min → 2280 woorden, 15 min → 2850 woorden, 18 min → 3420 woorden. Tel woorden in Phase 3, niet regels — paragraafbreaks en korte zinnen vertekenen lijnentellingen. Als het skelet projecteert op meer dan 110% van het budget, snoei nu, niet in Phase 3.
5. **Custom-component candidates.** Mark beats where an interactive moment would amplify the argument (timed viewer, comparator, side-by-side regime shift, etc.). Do *not* design the component. Just note it as a candidate; it gets built later via `add-interactive-component`.
6. **Source list so far.** Reproduce the list from 1b so the user can validate the research base.
7. **Stop. Show all of the above to the user.** Wait for sign-off or revision. Do not proceed.
### Phase 2 — Beeld- en video-onderzoek
 
Input: the signed-off skeleton from Phase 1.
 
For each beat that needs a visual or audio anchor, research and acquire the asset.
 
#### Image research
 
1. **Identify the canonical work.** Artist, title, year. Where multiple versions exist (sketches, replicas, prints), pick the one the argument actually needs.
2. **Plan multiple images per work as the default**, not the exception. The `figures.<key>.images` schema is an array, and the existing chapters routinely use 3–4 images for a single installation or painting. A single hero shot rarely teaches: an installation needs a wide view *plus* a corner detail; a painting wants the whole *plus* the relevant detail. **Voor gebouwen ligt de lat hoger** (gebruikersfeedback juni 2026): een gebouw is een ruimtelijke ervaring — het verandert per standpunt, lichtval en seizoen, en heeft een binnenkant. Richtcijfer 8–11 beelden per hoofdgebouw: wijde view, tweede gezichtspunt, nachtopname, meerdere interieurs, constructie-/materiaaldetail, eventueel bouwfase of seizoensvariant. Minder alleen als het aanbod het niet toelaat — noteer dat dan expliciet.
3. **Find a high-resolution source.** Praktische startpunten: Wikimedia Commons, museum open-access collecties (Rijksmuseum, Met, NGA, Tate, MoMA, Reina Sofía), de site van de kunstenaar of estate, pers-/tentoonstellingspagina's. Maar: **vrije licentie is geen selectiecriterium — kwaliteit wel.** Kies de beste foto, ook als die beschermd is (zie punt 9).
4. **Resolution target.** ~2000px on the long edge. Below 1500px is too small (header images and large blocks will look muddy on a 4K display). Above 4000px is wasted bandwidth — downscale or pick a smaller variant.
5. **Acquire the binary.** Gebruik de `image-downloader` MCP (`download_image`) om beelden op te halen; `curl` kan als fallback. Bestanden landen in `public/images/<theme-id>/`.
6. **Filename convention.** Lowercase, hyphenated, identifier-N pattern: `cattelan-1.jpg`, `pozzo-2.png`, `riley-3.png`. The identifier is short — usually artist surname or work-shorthand — and the number disambiguates when multiple images of the same work or artist appear.
7. **Capture the source URL** that points at the *page* the image came from (the Wikimedia Commons file page, the museum object page) — not the raw image URL. This goes into the frontmatter `source:` field.
8. **Write the caption.** Format: `<Artist>, <Title>, <year>`. Year format follows existing usage: a single year (`1907`), a range (`1495 tot 1498`), or an approximation (`rond 1290`). Use `,` as separator. Captions are in Dutch.
9. **Bronbeleid: citaatrecht als uitgangspunt.** Expliciete beslissing van de projecteigenaar (juli 2026): copyright is voor deze educatieve cursus geen selectiecriterium — citaatrecht dekt het gebruik. Beschermde persfoto's zijn toegestaan als ze sterker zijn dan het vrije aanbod. Bron altijd netjes in frontmatter `source:`. Alleen sites met expliciete "no reuse"-notices vermijden.
#### Video research
 
1. **YouTube only** for now (matches existing convention).
2. Find the canonical recording — official channel preferred (orchestra page, label, artist).
3. Capture: `youtube` (the 11-character video id), `title`, `source` (channel or attribution), and `start`/`end` in seconds when an excerpt is intended (omit `end` if the user should see from a point onward).
4. **Verify the start/end timing yourself.** Don't trust comment-section timestamps. Read the chapter context and pick the seconds that match the argument.
5. **A chapter can carry multiple videos** — one per relevant section is common. Don't ration them.
6. **Lange video's zijn extraatjes.** Verplicht leerlingen nooit een documentaire van 20+ minuten te bekijken tijdens het studeren: markeer lange video's expliciet als optioneel, en neem volledige docu's alleen op als extraatje — tenzij er een goed kort fragment (start/end) gevonden is. Trailers en korte fragmenten mogen gewoon in de leerlijn; rauw insider-materiaal ook alleen als extraatje.
#### Stop. Phase 2 report.
 
Show the user:
 
- For each figure: filename(s), source URL, caption, dimensions, copyright status note if non-trivial.
- For each video: id, title, start/end, what beat it serves.
- Anything you couldn't find — never silently substitute a weaker example.
Wait for confirmation. Do not start writing prose until the asset list is signed off.
 
### Phase 3 — MDX-uitwerking
 
Input: the signed-off skeleton (Phase 1) and signed-off asset list (Phase 2).
 
#### Frontmatter
 
Match the existing schema exactly. Mandatory fields: `id`, `title`, `module`, `order`, `figure`, `shortDescription`. Optional: `accentColor`, `image` (header image).
 
**Do not set `customStyles`, `customLayout`, or `customHeader`.** These are visual customisations the user adds later if needed. The skill produces the chapter content; styling is a separate decision the user owns.
 
`figures:` and `videos:` keys are short identifiers used by inline `[text](fig:key)` and `[text](video:key)` references. Use the same key in the body link and in the frontmatter map.
 
```yaml
figures:
  cattelan-comedian:
    images:
      - src: /images/<theme-id>/cattelan-1.jpg
        caption: Maurizio Cattelan, Comedian, 2019
        source: https://...
      - src: /images/<theme-id>/cattelan-2.jpg
        caption: David Datuna eet het werk op
        source: https://...
videos:
  beethoven:
    youtube: a9UApyClFKA
    title: Beethoven - Symphony No. 5 - Iván Fischer
    source: Concertgebouworkest
    start: 7
    end: 26
```
 
#### Body — pure markdown only
 
- One H1 (the title — repeated below the frontmatter, plain text, no spans).
- H2 for sections, H3 for subsections (sparingly).
- Inline references via `[link text](fig:key)` and `[link text](video:key)`. Every key used in body must exist in frontmatter. Every key in frontmatter should be used at least once.
- **No HTML, no custom CSS classes, no custom spans, no custom divs.** Pure markdown plus standard `<em>`/`<strong>` if you need them (rare — markdown's `*` and `**` work). Do not borrow `<span class="drift">` or any other class from inleiding/perspectief — those depend on customStyles files this chapter doesn't have. If the user later wants typographic flourishes, they will add CSS and class hooks themselves.
- Component imports go directly after the frontmatter, *if* a custom component is being integrated. If you are merely flagging candidates (skill default), use MDX comments instead:
  ```mdx
  {/* COMPONENT KANDIDAAT: a comparator side-by-side of the icon
      and Rafaël's School of Athens — would amplify the regime
      shift. Not built yet. */}
  ```
 
  MDX comments use `{/* ... */}` syntax, never `<!-- -->`.
- Length: aim for the budget set in Phase 1.
#### Bronnenlijst — verplicht
 
Every chapter ends with a `## Bronnen` section listing the externally-consulted research material from Phase 1b. Format: a markdown bullet list of `- [Titel — Uitgever](URL)` entries. Aim for 8–15 entries — the most useful, not exhaustive. Do not include entries that you didn't actually consult; do not pad. The list is reference material, not bibliography for show.
 
Image source URLs already live in the frontmatter `source:` fields — they don't need to be repeated in the bronnenlijst. The bronnenlijst is for textual research: scholarly articles, encyclopaedia entries, museum essays, news reports, interviews, etc.
 
#### Voice rules during writing — Dutch first, never translate
 
The single most common failure mode of this skill is *translating thought from English into Dutch*. Symptoms: grammatically correct sentences that no Nederlandstalige would actually write. The drafted prose then needs heavy human editing. To avoid this:
 
- **Draft in Dutch directly.** Do not think a sentence in English and translate it. If you catch yourself doing that, stop and recompose.
- **Read each paragraph silently as you write it, in Dutch.** If a sentence reads as a transliteration, rewrite.
- **Watch out for these specific transliteration patterns** (left = bad, right = better):
  - "Houd dat principe vast" (← *hold on to that*) → "Onthoud dat" / "Daar komen we op terug" / "Dat principe blijft staan"
  - "De man die het ontwierp heet Suger" (← *the man who designed it is called Suger*) → "Suger heeft het ontworpen, abt van Saint-Denis"
  - "Op het programma: de inwijding" (← translated lede) → "Die zondag werd er een nieuw glasraam ingewijd"
  - "Het idee dat een gebouw licht kan zijn" (← *the idea that a building can be light*) → "Een gebouw kan licht zijn"
  - "Maar onthoud dat ze alleen een aanwijzing zijn" (← *but remember that they are only*) → "Het zijn aanwijzingen, niet meer"
  - "Merk op wat verdwijnt" (← *notice what disappears*) → "Kijk wat er verdwijnt"
- **Vakterm-conventie boven academisch-correcte vertaling.** Binnen elk vakgebied (muziek, schilderkunst, architectuur) bestaat een gevestigde Nederlandse term voor de meeste vaktechnische concepten. Kies die conventionele term, niet een woordelijk-correcte vertaling. Voorbeeld: een *suspension* in de muziektheorie heet in Nederlandstalige muziekbronnen consequent **vertraging**, nooit *opschorting* — ook al is "opschorting" academisch een correcte vertaling. Voor *ground bass* is **vaste basfiguur** of **bas-ostinato** gangbaar, niet een verzonnen *grondbas*.
- **Verzin geen Nederlandse samenstellingen.** Veel transliteratiefouten ontstaan door een Engelse samenstelling letterlijk te vertalen naar een Nederlands woord dat niet bestaat. Vóór je een samengesteld vakwoord neerzet dat je nergens hebt gezien: check expliciet of die term zo voorkomt in een Nederlandstalig handboek, glossarium of museumtekst. Bestaat hij niet, gebruik dan het leenwoord (Engels, Italiaans, Frans) met cursivering. Leenwoorden zijn geen probleem zolang ze (a) echt bestaan en (b) de gangbare term zijn in dat domein.
- **Use Dutch idiomatic verb-second order** — Dutch tolerates fronting an adverbial, then verb, then subject ("Die zomer schreef hij...") and avoids the rigid English subject-verb opening on every sentence.
- **Vary sentence rhythm.** Dutch handles longer subordinated clauses well; don't chop everything into short translated-style sentences.
- **"Je" addressing the reader is the default.** "Wij" is for moments of shared looking.
- **Anchor every abstract claim in a concrete example within two paragraphs.**
- **Cut every sentence that could open with "We zullen nu onderzoeken" or "In dit hoofdstuk gaan we kijken naar".** Replace with the example itself.
- **Allow contradiction.** Each definitional move ("X is Y") deserves a counter-example before the section ends.
- **Don't soft-pedal critique.** The chapters are willing to call a market mechanism a market mechanism, name an institution, name a beneficiary.
#### Register — boeiend, niet hoogdravend
 
Gebruikersfeedback op eerdere hoofdstukken (graffiti-en-street-art, fotografie, aug 2026): de tekst zocht te vaak naar niet-courante woorden en stapelde aforismen, en klonk daardoor pretentieus. De projectstem is "intellectueel alert maar toegankelijk" — hoogdravendheid is de valse versie daarvan. Spanning komt uit het verhaal, het tempo en de feiten, niet uit een verheven register.
 
- **Courant woord boven literair synoniem.** Test per woord: zou een goede reportagejournalist het gebruiken? Woorden als *zwier*, *adel* (figuurlijk), *buitengrens*, *onverbiddelijk* horen bij een register dat als pose leest. Eén gemarkeerd woord per sectie kan werken; de dichtheid is het probleem.
- **Aforisme-budget: hooguit één epigrammatische slotzin per sectie.** Niet elke paragraaf mag eindigen op een gebeitelde punchline. "De moeite is de boodschap", "Het cv telt zwaarder dan het meesterwerk" en "Radicaliteit blijkt een ladder zonder hoogste sport" in één hoofdstuk is twee te veel — één raak aforisme werkt, een reeks leest als pose.
- **Metafoor alleen als hij iets laat zien.** "Lettervormen als runen" toont de lezer iets; "een eigen adel" decoreert alleen. Schrap decoratieve metaforen.
- **Regie-imperatieven doseren.** "Let op wat hier ontstaat", "Kijk wat hier gebeurt", "Lees die uitspraak twee keer" — hooguit één per hoofdstuk. Herhaald wordt het een tic die de lezer bij het handje neemt.
- **Herschrijftest.** Wil een zin vooral indruk maken met taal in plaats van met inhoud, herschrijf hem zoals je het mondeling aan een collega zou vertellen — behoud het ritme, laat de woordenschat zakken.
## Verification before delivery
 
Movement-level checklist. Read your draft against it. Do not check by comparing prose to `inleiding.mdx` — that path leads to homogenisation.
 
- [ ] Opening paragraph anchors in a specific event, place, year, or person — not in an abstract claim.
- [ ] Title is a question the chapter actually answers (or productively refuses).
- [ ] At least three examples that bridge eras, registers, or cultural traditions — *when the subject invites it*. If the chapter is genuinely single-tradition (e.g. a chapter on Belgian comic strips), accept that and keep the parallels internal to the tradition.
- [ ] One moment where the reader is directly addressed and reframed.
- [ ] Critical undertow waar het onderwerp erom vraagt — maar check ook het omgekeerde: is kritiek hier de kern of de bijstem, en is dat een bewuste keuze?
- [ ] Frontmatter validates: required fields present, every `fig:`/`video:` ref in body has a key in frontmatter, every figure has a `source:`.
- [ ] Every image referenced exists at the declared path under `/public/images/<theme-id>/`.
- [ ] **Math en geografie expliciet dubbelgecheckt.** Voor elke tijdsclaim ("X jaar later", "Y eeuwen voor", "een eeuw vergeten"): doe de rekensom uit en verifieer met de jaartallen die elders in het hoofdstuk staan. Voor elke plaatsnaam met meerdere mogelijke referenten ("Notre-Dame" — Parijs of Reims? "San Marco" — Venetië, of een andere?): voeg een kwalificator toe ("Notre-Dame te Parijs", "de Reimse kathedraal") of verwijder de ambiguïteit. Dit zijn precies de plekken waar onder lengte-druk slordigheid binnenkomt.
- [ ] Chapter ends with a `## Bronnen` section linking to the textual research consulted in Phase 1b.
- [ ] **No HTML, no custom CSS classes, no `<span class="...">` borrowed from other chapters.** Pure markdown body.
- [ ] **No frontmatter `customStyles`, `customLayout`, or `customHeader`.** The user adds visual styling later.
- [ ] No leftover OneNote artefacts (numbered lists like "1.1, 1.2", academic phrasing, slide-deck residue).
- [ ] Length within budget — woordental van de body-prose binnen het in Phase 1c afgesproken bereik (leestijd × 190 wpm). Waarschuw de gebruiker bij >110% van het budget.
- [ ] Custom-component candidates are MDX comments, not actual imports — unless the component has already been built.
- [ ] No closing pattern that mechanically copies another chapter (no auto-included "Drie vragen" closer, no auto-`<RegimeSection>` framing).
- [ ] **Sample three random paragraphs and re-read them in Dutch.** If any reads as direct translation from English, rewrite before delivery.
- [ ] **Register-check.** In diezelfde drie paragrafen: streep elk woord aan dat je niet in een krantenreportage zou tegenkomen, en tel de epigrammatische slotzinnen per sectie (max één). Meerdere strepen per paragraaf of gestapelde punchlines = hoogdravend; herschrijf vóór levering.
- [ ] **Every factual claim has a verifiable source from the Phase 1b research.** Old course material does not count as a source.
## Output for the user at end of Phase 3
 
1. The MDX file at `src/content/themes/<theme-id>.mdx`, ending in a `## Bronnen` section.
2. A short summary listing: throughline question chosen, examples kept/replaced/dropped relative to the old material, custom-component candidates flagged, anything you couldn't research and want the user to decide.
3. Any judgement calls worth flagging — e.g. "I dropped the old anecdote about X because it didn't fit the throughline; if you want it back, here's where it would slot."
## Common pitfalls
 
- **Skipping research.** The single most common failure: jumping from the old material to a skeleton without a Phase 1b research pass. Old course material gets things wrong, omits sharper framings, and misses cross-references that would strengthen the chapter. If the skeleton report doesn't include a source list, you skipped Phase 1b.
- **Translating instead of rewriting.** Old course text often has academic register baked in. If your draft sounds like a smoothed translation from English (or a smoothed translation from the old material's register), you're in trouble. Restart from the throughline question.
- **Hoogdravendheid als stijlmiddel.** Niet-courante woorden, gestapelde aforismen en decoratieve metaforen zijn geen extra kwaliteit maar de valse variant van "intellectueel alert". Zie het Register-blok onder de voice rules; de register-check in de verificatielijst vangt dit vóór levering.
- **Borrowing CSS classes.** `<span class="drift">` works in inleiding because inleiding has a `customStyles: 'inleiding.css'` file with the matching CSS. In a fresh chapter without that file, the span renders as plain text and confuses the reader. Pure markdown only.
- **Padding to fill length.** If the chapter wants to be 180 lines, let it be 180 lines. Better short and dense than long and slack.
- **Reusing the same image across chapters without checking.** Inleiding and perspectief both use `monalisa.png`, `school-of-athens.png` — that's intentional cross-referencing. New chapters should reuse where it amplifies, never out of laziness.
- **Auto-generating "drie vragen" or any other closer that exists in another chapter.** Each chapter's ending must come from its own argument.
- **Forcing a cross-cultural pivot when the subject doesn't invite one.** A chapter on perspective in Western painting can carry a Tanizaki/Hiroshige beat well; a chapter on the Belgian art-school system probably can't. Use research to surface counterweights — don't manufacture them.
- **Negeren van `docs/REDACTIE.md`.** Daar staan inhoudelijke afspraken (geen Arcane, SMOLE alleen als lesbeeld, Banksy ≠ graffiti, ...) die je niet uit de tekstbestanden kan afleiden. Lees het vóór het skelet.
## Canonical references
 
When in doubt about voice, read `inleiding.mdx`. When in doubt about how a chapter handles multiple cultural registers within one argument, read the first half of `smaak-klasse-macht.mdx`. When in doubt about how a single concept (perspectief) carries an entire chapter through structural shifts, read `perspectief-en-ruimte.mdx`. When in doubt about how a finished chapter integrates Phase 1b research, end-of-chapter `## Bronnen`, and pure-markdown body, read `licht-en-schaduw.mdx`.
 
When in doubt about voice — meaning specifically: re-read for the *moves*, not the sentences. The verification checklist above is built around those moves. Use it.
