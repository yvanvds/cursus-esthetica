---
name: work-issues
description: Werk GitHub issues van deze cursus één voor één af — issue → branch → werk met checkpoints → build-gate → PR → merge → live op de site. Roep aan als /work-issues met issuenummers ("/work-issues 12 13"), met een labelfilter ("/work-issues --label hoofdstuk"), of leeg (dan toont de skill de open issues). Gebruik dit ook wanneer de gebruiker nieuw werk voorstelt zonder issue ("we moeten hoofdstuk X nog schrijven", "die beelden zijn te klein") — dan maakt de skill eerst het issue. Dit is de tegenhanger van work-batch voor inhoudelijk werk: één issue per PR, geen chunks, gates zijn build en render in plaats van tests.
---

# Issues afwerken in dit cursusproject

Deze skill vervangt het heen-en-weer tussen Cowork en Claude Code. Al het werk
— ook het werk dat geen code is — begint bij een issue, landt als bestanden in
de repo, en staat na de merge op de live site.

Verwant: [[start-work]] (interactieve issue→PR-flow), [[work-batch]] (batch voor
code-issues), [[draft-theme-chapter]], [[add-interactive-component]], [[slidev]].

## Wat hier anders is dan work-batch

| | work-batch | work-issues |
|---|---|---|
| PR's | gechunkt, 4–7 issues per PR | **één issue per PR** |
| Gate | testsuite | `astro check` + `npm run build` + render-check |
| Reviewmoment | de PR | **de checkpoints tijdens het werk** |
| Werkers | subagent per issue | de hoofdsessie zelf |

Waarom geen chunks: bij inhoudelijk werk is de diff niet los te lezen van de
keuzes die eraan voorafgingen. Vier hoofdstukken in één PR is niet te
beoordelen, en één slechte alinea zou drie goede hoofdstukken gijzelen.

Waarom in de hoofdsessie en niet in subagents: de keuzes zijn subjectief en de
gebruiker zit erbij. Een subagent kan geen checkpoint houden. Alleen breed
zoekwerk (beeldresearch, factchecking van een lange lijst) mag naar een
subagent — de beslissingen niet.

## Autonomiecontract (vastgelegd 2026-08-31)

- Branch, push, PR en merge zijn **vooraf goedgekeurd**. Vraag daar niet om.
- Mergen zodra de PR-check groen is. **Nooit een rode PR mergen.**
- De merge deployt naar de live site. Er is daarna geen tweede poort.
- **Daarom is een checkpoint niet optioneel.** Het reviewmoment ligt vóór de
  PR, niet erna. Twijfel je of iets een keuze van de auteur is: stop bij het
  checkpoint. Sla nooit een checkpoint over met "de gebruiker kan het in de PR
  nog zien" — dat klopt hier niet.
- Bij rood: maximaal 2 fixpogingen, daarna stoppen. Issue blijft open, branch
  blijft staan, meld wat er stuk is. Ga niet door naar de volgende issue zonder
  dat te melden.

## Stap 0 — Voorwaarden

```
gh auth status
git status --porcelain      # moet leeg zijn
git checkout main && git pull --ff-only
```

Vuile working tree: **stop en vraag**. Uitzondering: horen de gewijzigde
bestanden precies bij de issue die je gaat doen (de gebruiker was er zelf al in
begonnen), vraag dan of ze mee mogen in deze branch.

Integratiebranch is `main` — deze repo heeft geen `develop`.

## Stap 1 — Wachtrij bouwen

- Expliciete nummers → in die volgorde.
- `--label X` → `gh issue list --label X --state open --json number,title,labels`.
- Geen argument → `gh issue list --state open` tonen en vragen welke.

Haal per issue de volledige inhoud op:

```
gh issue view N --json number,title,state,body,labels,comments
```

Gebruik de `--json`-vorm, **niet** `gh issue view N --comments`: die laatste
print lege output (exit 0) bij een issue zonder comments, wat op een mislukte
call lijkt.

Echo daarna het plan, één regel per issue, met werktype en checkpoints:

```
#12 hoofdstuk  Fotografie herzien   → 3 stops (skelet / beeld / tekst)
#13 beeld      Graffiti-beelden bij → 1 stop (assetlijst)
#14 redactie   Typo's inleiding     → geen stops
```

Volgorde: afhankelijkheden eerst. Een component die in een hoofdstuk moet komen,
gaat vóór de hoofdstuk-issue die hem gebruikt. Is de volgorde onduidelijk, vraag
het — dat is één regel en bespaart herwerk.

Houd de voortgang bij met TodoWrite: één item per issue.

### Nieuw werk zonder issue

Stelt de gebruiker werk voor zonder issuenummer, maak dan eerst het issue —
issue-first geldt ook hier. Kies het juiste template
(`.github/ISSUE_TEMPLATE/`), toon titel + body + label, en maak het aan na
akkoord. Dat kost een halve minuut en levert de titel, het label en de scope op
die de rest van deze skill nodig heeft.

## Stap 2 — Werktype bepaalt skill, checkpoints en verificatie

Het label bepaalt het werktype. Staat er geen inhoudelijk label, leid het af uit
de issuetekst en zet het label alsnog (`gh issue edit N --add-label ...`).

| label | volg deze skill | harde stops | extra verificatie |
|---|---|---|---|
| `hoofdstuk` | `draft-theme-chapter`, volledig | **3**: skelet+bronnen → assetlijst → concepttekst | woordbudget (leestijd × 190), registercheck, `## Bronnen`, alle `fig:`/`video:`-refs |
| `beeld` | `draft-theme-chapter` fase 2 | **1**: assetlijst vóór downloaden | bestanden bestaan, `source:` ingevuld, ~2000px lange zijde |
| `component` | `add-interactive-component` | **1**: interactie-ontwerp vóór de bouw | island rendert in `npm run dev`, geen hardcoded kleuren/fonts |
| `slides` | `slidev` + `docs/`-conventies | **1**: slide-outline vóór het uitschrijven | `npm run build:slides` groen, deck opent op `/slides/<id>/` |
| `redactie` | geen | geen | build + toon de diff in het rapport |
| `site` | geen | geen, tenzij het zichtbare vormgeving verandert — dan 1 | build + pagina bekeken in `npm run dev` |

Bij een gecombineerd issue (hoofdstuk *en* de component erin): neem de stops van
het zwaarste type over. Overweeg om het te splitsen in twee issues als het werk
in twee losse PR's beter te beoordelen is.

Lees vóór elk inhoudelijk issue `docs/REDACTIE.md`. Daar staan afspraken (geen
Arcane, Banksy hoort bij street art, citaatrecht als uitgangspunt, kritiek is
geen default-essentie) die je niet uit de bestanden kan afleiden.

## Stap 3 — Per issue

### 3a. Intake

Vat de issue in een paar zinnen terug: wat je gaat doen, welk werktype, en
vooral **wat er in de issue ambigu is**. Dit is je enige moment om scope-onzin
te vangen vóór je 2000 woorden schrijft. Is de opdracht echt onduidelijk, vraag
het nu — niet halverwege.

### 3b. Branch

```
git checkout -b <label>/issue-<N>-<slug>     # bv. hoofdstuk/issue-12-fotografie-herzien
```

`<slug>` is 2–4 woorden kebab-case uit de titel. Meld de branchnaam in één regel.

### 3c. Werken

Volg de skill uit de tabel. Daarbovenop gelden hier drie regels:

- **Blijf binnen de issue.** Kom je iets anders tegen dat stuk of beter kan:
  maak een nieuw issue (`gh issue create`), meld het in één regel ("Issue #N
  gemaakt voor X — valt buiten deze branch"), en werk verder. Rek deze PR niet
  op. Follow-ups mogen wél achteraan de wachtrij van deze sessie.
- **Schrijf naar de bestanden, niet naar het gesprek.** Concepttekst gaat direct
  naar `src/content/themes/<id>.mdx`, niet als lap tekst in de chat. Bij een
  checkpoint toon je de relevante passages of de diff — het bestand is de bron.
- **Beslis zelf waar de keuze geen smaak is** (zie hieronder).

### 3d. Verificatie — de content-gates

Deze vervangen de testsuite. Draai ze in deze volgorde en ga niet naar de PR
tot ze groen zijn.

1. **`npx astro check`** — 0 errors, 0 warnings. Vangt frontmatter die niet aan
   `src/content.config.ts` voldoet en TypeScript in componenten.
2. **`npm run build`** — site én slides. De slidebuild hoort erbij: een kapot
   deck breekt de deploy van de hele site.
3. **Referentie- en bestandscheck** *(handmatig — de build vangt dit niet)*.
   `remark-figure-links` faalt stil op een onbekende key, en de build controleert
   geen bestaan van beeldbestanden. Voor elk gewijzigd MDX-bestand:
   - elke `[tekst](fig:key)` en `[tekst](video:key)` in de body heeft een key in
     de frontmatter, en elke key in de frontmatter wordt minstens één keer
     gebruikt;
   - elk `src: /images/...` bestaat als bestand onder `public/`;
   - elke figure heeft een `source:`.
4. **Render-check** — voor alles wat de lezer ziet (hoofdstuk, component,
   slides, vormgeving). Start `npm run dev` en open de gewijzigde pagina op
   `http://localhost:4321/cursus-esthetica/<theme-id>/` (routes staan in
   `src/pages/[theme].astro`). Kijk of beelden laden, of een interactieve
   component reageert, en of er geen ruwe MDX-syntaxis of lege figuurblokken in
   de tekst staan. Dit is het equivalent van de integratietest uit `start-work`:
   `astro check` bewijst dat het bouwt, niet dat het klopt.
   Sla dit alleen over als de wijziging niets rendert (een docs-bestand, een
   scriptaanpassing) — en zeg dat dan expliciet in de PR.

Faalt er iets, repareer het vóór de PR. Een fout die je niet zelf veroorzaakte
is geen "bestaand probleem": zoek de commit die hem introduceerde
(`git log -S`, `git log --oneline <bestand>`) en maak er een issue van als de
fix elders hoort.

### 3e. Commit, PR, merge

```
git add <paden>                      # expliciete paden, nooit `git add -A`
git commit -m "hoofdstuk: fotografie herzien (#12)"
git push -u origin <branch>
gh pr create --base main --title "..." --body "..."
```

De working tree bevat vaak losstaand werk van de gebruiker. Stage alleen de
bestanden die bij deze issue horen.

PR-body volgt `.github/pull_request_template.md`: wat er verandert en waarom,
`Closes #N`, en een controlelijst met de **echte** uitkomsten van 3d (welke
commando's, wat ze zeiden, welke checkpoints doorlopen zijn) — geen
aangevinkte wenslijst.

Wacht dan op de check en merge:

```
gh pr checks <pr> --watch --interval 20 --fail-fast
gh pr merge <pr> --squash --delete-branch
```

Rood → korte foutregel ophalen (`gh run view <id> --log-failed`), fixen, pushen,
opnieuw wachten. Na 2 mislukte pogingen: stoppen en melden.

Start er binnen enkele minuten geen run, dan is de webhook verdwenen; duw met
een lege commit of dispatch de workflow op de branch.

### 3f. Naar de site

De merge naar `main` triggert `Deploy to GitHub Pages`. Volg hem tot het einde —
pas dan staat het werk er echt:

```
gh run list --branch main --limit 1
gh run watch <id> --exit-status
```

Groen → meld de URL: `https://yvanvds.github.io/cursus-esthetica/<theme-id>/`.
Rood → dat is een gebroken live site en heeft voorrang op de volgende issue.

Ruim daarna lokaal op:

```
git checkout main && git pull --prune
git branch -d <branch>
```

Weigert `-d`, controleer eerst met `git branch --merged origin/main` dat het werk
echt geland is (bij een squash-merge ziet git de commits niet terug). Pas daarna
`-D`.

## Wanneer stoppen, wanneer zelf beslissen

Het verschil tussen bruikbaar en vermoeiend werk zit hier. De vuistregel: **stop
voor keuzes die de auteur later zou willen terugdraaien, beslis zelf over alles
wat je toch nog kan aanpassen.**

**Stop en vraag** (ook buiten de vaste checkpoints):

- een voorbeeld, kunstwerk of casus schrappen of vervangen die de gebruiker zelf
  heeft aangedragen;
- de rode draad of de toon van een hoofdstuk anders leggen dan de issue zegt;
- iets dat `docs/REDACTIE.md` tegenspreekt — vraag, en als de afspraak echt
  verandert, werk `REDACTIE.md` bij in dezelfde PR;
- een claim die je niet geverifieerd krijgt en die dragend is voor een sectie;
- een beeld dat je nergens in fatsoenlijke resolutie vindt terwijl de sectie
  erop leunt (nooit stilzwijgend een zwakker beeld inschuiven);
- werk dat structureel groter blijkt dan de issue beschrijft.

**Beslis zelf, meld het hooguit in één regel** in het eindrapport:

- bestandsnamen, mapindeling, key-namen in de frontmatter;
- welke van twee gelijkwaardige foto's van hetzelfde werk;
- zinsbouw, alineagrenzen, kopteksten binnen de afgesproken rode draad;
- CSS-details die binnen de tokens blijven;
- commit- en PR-teksten;
- volgorde van secties, zolang het argument klopt.

Verzamel kleine vragen tot het eerstvolgende checkpoint in plaats van ze los te
stellen. Eén blok van drie vragen onderbreekt minder dan drie losse vragen.

## Eindrapport

Na de laatste issue één compact overzicht — geen bestanden opnieuw inlezen:

```
3 issues af, 1 open
  #12 ✓ hoofdstuk fotografie herzien   → PR #21 gemerged, live
  #13 ✓ 9 beelden graffiti toegevoegd  → PR #22 gemerged, live
  #14 ✓ typo's inleiding               → PR #23 gemerged, live
  #15 ⚠ component muybridge — gestopt: build faalt op react 19 island (2 pogingen)
Nieuw gemaakt: #16 (slidedeck fotografie, volgt uit #12)
Nu op main, working tree schoon.
```

Meld eerlijk wat er niet af is en wat de gebruiker moet bekijken. Noem
zelfgemaakte keuzes die de moeite van het terugdraaien waard kunnen zijn. Een
issue die is blijven liggen staat vooraan, niet onderaan.
