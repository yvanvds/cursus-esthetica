---
name: create-issues
description: Maak van een observatie, een wens of een lijst voorstellen GitHub-issues voor deze cursus, geschreven zodat /work-issues ze zonder de gespreksgeschiedenis kan afwerken. Roep aan als /create-issues met een omschrijving ("de accentkleuren zijn verdwenen", "de hoofdstukken missen een eigen stijl", "drie beelden staan gedraaid") of leeg, dan vraagt de skill eerst de observatie. Gebruik dit ook zonder expliciete aanroep zodra de gebruiker zegt "maak er issues van", "zet dit op de lijst", "wat moet hier gebeuren", een probleem beschrijft en om voorstellen vraagt, of meerdere stukken werk tegelijk noemt, ook als het woord issue niet valt. Dit is de tegenhanger van work-issues: deze skill levert de wachtrij, die skill werkt ze af. Deze skill voert zelf niets uit, geen code, geen tekst, geen sessies. Alleen issues.
---

# Issues maken voor dit cursusproject

Al het werk in dit project begint bij een issue en eindigt in een PR
(`work-issues`). Deze skill is de stap ervoor: van "ik zie dit" naar een
wachtrij van issues die `work-issues` kan afwerken zonder dat iemand toekijkt.

De uitvoer is daarom precies de invoer van die skill: nummers in
afhankelijkheidsvolgorde, als één runbaar commando.

```
/work-issues 120 121 122 123
```

Verwant: [[work-issues]] (werkt de wachtrij af), [[draft-theme-chapter]],
[[add-interactive-component]], [[slidev]] (de skills waar een issue in landt).

## De toets: een verse subagent, alleen de tekst

`work-issues` delegeert elk issue aan een verse `general-purpose` subagent
zodra de keuzes gemaakt zijn. Die subagent heeft dit gesprek niet gezien. Alles
wat je nu weet en niet opschrijft, moet hij koud opnieuw afleiden, of hij
raadt ernaar.

Stel bij elk issue dus één vraag: **kan een subagent dit uitvoeren met alleen
de issue-tekst en de repo?** Dat betekent concreet:

- de oorzaak is geverifieerd en staat erin, met het bewijs;
- de bestanden staan erin, met pad;
- de beslissingen die de eigenaar nog moet nemen staan genummerd klaar;
- het bewijs dat het werk klaar is, staat benoemd, niet als oordeel maar als
  waarneming;
- de afhankelijkheid van andere issues staat bovenaan.

Een issue dat de discussie van deze sessie nodig heeft om begrepen te worden,
is mislukt, hoe goed de lijst er ook uitziet.

## Stap 0 — Lezen en verifiëren vóór je schrijft

Lees `CLAUDE.md`, de templates onder `.github/ISSUE_TEMPLATE/` en, bij
inhoudelijk werk, `docs/REDACTIE.md`. Haal de open issues op, zodat je niets
dubbel maakt en naar bestaande issues kunt verwijzen:

```
gh issue list --state open --limit 100 --json number,title,labels
```

**Verifieer de observatie.** De gebruiker beschrijft wat hij ziet; dat is
zelden de oorzaak. Kijk zelf voor je schrijft:

- Wat rendert: `npm run dev` en de pagina openen, of de live site met `curl`.
  Een berekende CSS-waarde of de volgorde van de `<head>` is in een minuut
  gecontroleerd en vervangt een halve pagina speculatie.
- Wat "verdwenen" is: `git log -S"<term>" -- <pad>` en `git log -p`. Op
  2026-10-15 was de klacht "de accentkleuren zijn verdwenen". Geen enkele was
  verwijderd; ze stonden alle zeven nog in de frontmatter. Ze waren onzichtbaar
  omdat een `<style>` in de head-slot vóór de Astro-bundel rendert en `:root`
  in tokens.css daardoor wint. Dat is een ander issue dan "zet ze terug".
- Wat een eerder issue of PR al zei: `gh issue view N --json title,body` en
  `gh pr view N --json body`. Een regressie heeft een commit; noem hem.

Een issue met een verkeerde oorzaak kost de subagent uren en de eigenaar het
vertrouwen in de lijst. Verifiëren kost minuten.

## Stap 1 — Snijden

**Eén issue is één PR is één subagent.** Dat is de maat. Snij een observatie
in stukken langs deze lijnen:

- **Werktype.** Het label bepaalt de skill, de checkpoints en de gate in
  `work-issues`. Een hoofdstuk en de component erin zijn twee issues; de
  component gaat voorop.
- **Oorzaak.** Wat dezelfde oorzaak deelt, hoort bij elkaar. De hardgecodeerde
  kleuren in FigureLink hoorden bij het cascade-issue, niet in een eigen
  issue: één PR die het mechanisme herstelt, herstelt ze mee.
- **Blokkade.** Wat de andere issues nodig hebben, komt eerst en krijgt dat
  als eerste zin: "Dit issue blokkeert #…". Een mechanisme vóór de dertien
  hoofdstukken die erop bouwen.
- **Pilot.** Als meerdere issues hetzelfde nieuwe terrein betreden (de eerste
  lichte pagina, de eerste eigen layout), wijs er één aan als pilot en zeg in
  de andere dat ze erna komen. Zo wordt het terrein één keer verkend.
- **Beslissing.** Een stuk dat op een andere keuze van de eigenaar wacht dan
  de rest, is een eigen issue.

Niet te fijn snijden: een regel CSS die bij een groter issue hoort, krijgt
geen eigen nummer. Niet te grof: een issue dat twee labels nodig heeft, is
bijna altijd twee issues.

De labels en wat ze voor `work-issues` betekenen:

| label | skill daar | stops daar | wat het issue dus moet bevatten |
|---|---|---|---|
| `hoofdstuk` | `draft-theme-chapter` | 3 | rode draad, leestijd, bronmateriaal, vaste keuzes |
| `beeld` | `draft-theme-chapter` fase 2 | 1 | welke werken, hoeveel beelden, welke standpunten |
| `component` | `add-interactive-component` | 1 | didactisch doel, interactie, benodigd materiaal |
| `slides` | `slidev` | 1 | de beats van de les, wat mee moet |
| `redactie` | geen | 0 | waar, wat er mis is, gewenste richting |
| `site` | geen | 1 als het zichtbaar is | wat, waar in de code, zichtbaarheid, bewijs |

De volgorde van de lijst is de volgorde waarin `work-issues` ze krijgt.
Afhankelijkheden eerst, pilots vóór de reeks, daarna de rest.

## Stap 2 — Eén checkpoint: de lijst

Toon de lijst vóór je iets aanmaakt: per issue de titel, het label, één regel
over de inhoud, en de afhankelijkheid. Dit is de plek waar "doe eerst
voorstellen" en "maak er issues van" samenvallen: de lijst ís het voorstel,
met de redenering erbij. Noem daar ook de beslissingen die je in de bodies gaat
zetten, zodat de eigenaar ze nu al kan beantwoorden of bewust kan laten staan.

Eén stop, niet één per issue. Zegt de eigenaar "maak ze allemaal", dan maak
je ze allemaal, in de getoonde volgorde. Wijzigt hij de lijst, dan toon je de
nieuwe lijst niet opnieuw; je maakt ze.

## Stap 3 — De body

De vorm volgt de template van het label (`.github/ISSUE_TEMPLATE/<label>.yml`
levert de koppen). Daarbovenop krijgt elk issue, welk label ook, deze
blokken, want dit zijn de dingen die `work-issues` nodig heeft vóór het kan
delegeren:

- **Theme-id en afhankelijkheid** als eerste regel bij alles wat aan een
  hoofdstuk hangt: `**Theme-id:** \`licht-en-schaduw\`. Na #120.`
- **Nu.** De huidige toestand zoals je hem geverifieerd hebt, met wat er al is
  (componenten, stylesheet, deck) en wat er ontbreekt.
- **Voorstel.** Concreet genoeg om te bouwen: welke elementen, welke waarden,
  welke bestanden. Waarden die een keuze zijn, markeer je als *indicatief* en
  zet je in de beslissingen.
- **Beslissingen vóór de bouw.** Genummerd. Dit is wat `work-issues` aan de
  eigenaar voorlegt vóór het delegeert; wat hier niet staat, beslist de
  subagent zelf. Alleen echte keuzes van de auteur: smaak, scope, wat de
  lezer ziet. Geen "mag ik beginnen".
- **Waar in de code.** Paden, ook van bestanden die nog niet bestaan.
- **Bewijs.** Wat de PR moet laten zien, als waarneming: een tabel met
  berekende waarden, screenshots van benoemde toestanden, de uitvoer van een
  commando. Benoem de faalmodus die geen foutmelding geeft en vraag het bewijs
  dat hij zich niet voordoet (zie `work-issues` § Bewijslast). Sluit af met de
  gates: `npx astro check`, `npm run build`, `npm run check:chapters` als
  er frontmatter of beelden in het spel zijn, en `npm run check:vue` als er
  iets onder `slides/theme/` verandert.
- **Zichtbaarheid** (bij `site`): ja of nee, en of er een ontwerp-checkpoint
  komt.

Titels volgen de bestaande issues: `<theme-id>: <wat>` voor alles wat aan een
hoofdstuk hangt, `site: <wat>` voor de site zelf, `slides: <wat>` of
`Deck voor hoofdstuk N: <wat>` voor decks. Kort, concreet, zonder punt.

Register: dat van het project. Courant Nederlands, concrete bestandsnamen en
waarden, geen opsmuk. Een body van 25 tot 60 regels is normaal. Wordt hij
langer, dan zijn het twee issues of is het een plan en geen issue.

Schrijf de bodies als bestanden in de scratchpad, één per issue, niet als
lappen tekst in het gesprek. Lange heredocs breken de Bash-tool af; gebruik
daarvoor de Write-tool.

## Stap 4 — Aanmaken in volgorde, kruisverwijzingen daarna

Vooruitverwijzingen bestaan nog niet op het moment dat je het eerste issue
maakt. Schrijf ze daarom als plaatshouder (`{{CASCADE}}`, `{{MEERST}}`), maak
alles aan, verzamel de nummers, vul in en werk de bodies bij:

```
for f in $(ls "$D"/[0-9][0-9]-*.md | sort); do
  key=$(basename "$f" .md | cut -d- -f2)
  url=$(gh issue create --title "$title" --label "$label" --body-file "$f")
  echo "$key=${url##*/}" >> "$D/numbers.txt"
done
for f in "$D"/[0-9][0-9]-*.md; do
  while IFS='=' read -r key num; do sed -i "s/{{$key}}/#$num/g" "$f"; done < "$D/numbers.txt"
done
# daarna per issue: gh issue edit "$num" --body-file "$f"
```

Controleer na afloop dat geen enkele live body nog `{{` bevat en dat elk issue
zijn label heeft. Dat is één `gh issue view` per nummer; sla het niet over.

## Stap 5 — Overdracht

Sluit af met drie dingen en niets anders:

1. De lijst met nummers en titels, in de volgorde waarin ze gewerkt moeten
   worden, met de afhankelijkheden in één woord erbij.
2. De open beslissingen, verzameld uit de bodies, zodat de eigenaar ze vóór de
   batch kan beantwoorden als hij dat wil.
3. Het commando:

   ```
   /work-issues 120 121 122 123
   ```

**Geen sessiekaart, geen voorstel om te beginnen, geen eerste issue alvast
oppakken.** De eigenaar start `/work-issues` zelf, meestal als eerste bericht
in een verse sessie, en laat het dan uren lopen. Een kaart of een vraag "zal
ik beginnen?" breekt die flow; het commando volstaat.

## Wat deze skill niet doet

- **Geen werk uitvoeren.** Ook geen "kleine fix alvast". Alles wat aangeraakt
  wordt, gaat via `work-issues`.
- **Geen werk verzinnen** buiten de observatie. Zie je onderweg iets anders
  dat stuk is, noem het in één regel bij het checkpoint en laat de eigenaar
  beslissen of het een issue wordt.
- **Geen plannen.** Een document dat de samenhang uitlegt, hoort niet in een
  issue. Hangt de samenhang aan een mechanisme, dan is dat mechanisme het
  eerste issue en verwijzen de andere ernaar.
- **Geen duplicaten.** Bestaat er al een open issue voor, verwijs ernaar of
  stel voor het te verrijken met `gh issue edit`.

## Valkuilen uit de praktijk

- **"Verdwenen" betekent zelden verwijderd.** Controleer git én de render
  voor je een oorzaak opschrijft.
- **Een indicatieve waarde is geen beslissing.** Een kleurcode of een font in
  het voorstel is een startpunt; de keuze staat in het beslissingenblok. Bij
  een accentkleur op de donkere grond hoort de contrastratio (minstens 4.5:1
  voor links) bij het bewijs.
- **De subagent kent het gesprek niet.** Lees elke body één keer alsof je hem
  morgen in een lege sessie krijgt. Wat dan ontbreekt, ontbreekt echt.
- **Vooruitverwijzingen.** Plaatshouders, nummers, dan pas de bodies; niet
  andersom.
- **Lange heredocs.** Boven een paar kilobyte breekt de Bash-tool het commando
  af met een onbegrijpelijke quote-fout. Write-tool per bestand.
