# Ontwerpregels Moonshine Backoffice

Een werktool voor zes mensen, vaak op de telefoon. Rustig, compact, taakgericht.
`backend/core/tests/test_design.py` bewaakt de harde regels (draait mee met `manage.py test`).

## Structuur
- **Sectie = kop op de achtergrond** (`.block` + `.block-head h2`), zonder kader. Items staan samen in één `.panel` als rijen (`.rows`) met haarlijnen. Een los kader alleen voor iets dat je op zichzelf bedient.
- Geen kaart-in-kaart, geen kolommenbord met kaartjes. Lijsten zijn rijen.
- **Paginakop**: één regel titel + acties rechts (`PageTitle`). Geen bovenkopje (eyebrow), geen beschrijvende ondertitel; alleen een ondertitel als die data draagt (datum, status).
- Filters: één `.seg` per scherm. Eén primaire knop per scherm.
- Lege staat: één regel (`.empty-line`), geen groot paneel met icoon en uitleg.

## Componenten (v1.6, `system.css` onderaan)
- Maten: knoppen/invoer 34px (klein 28px), icoonknoppen 32px, radius 7px voor controls en 10px voor panelen. Eén transitie (120 ms).
- Kleur: charcoal (`--bg #121214`), bordeaux accent (`--accent`). Focus = lichte ring, geen blauw.
- Status = neutrale badge met een gekleurde stip (`.badge.lime/amber/red/blue/purple`).
- Tabellen: stille kopregel, rijen 44px, hover `--wash-1`, chevron pas bij hover (`td.row-go`).
- Lege staat: één rij (icoon, wat ontbreekt, één actie) via `<Empty>`; meldingen inline en klein.
- Cijfers bovenaan een pagina in één strook (`.kpis`, `.stats`), niet in losse kaarten.
- Agenda is de enige plek met een kleur per soort: alleen als dun streepje/blokje (`--c` per `.src-*`).

## Mobiel
- Onderbalk met Overzicht, Taken, Events, Meetings en Meer. Knoppen in de kop worden iconen.
- Eerst de inhoud: kop zo laag mogelijk, geen uitleg boven de lijst.

## Kleur
- Alleen tokens uit `frontend/src/styles/system.css` (`var(--…)`). Geen hex-kleuren elders (alleen puur zwart voor schaduwen).
- **Kleurbudget**: accent alleen voor de primaire actie en de actieve plek in de navigatie. Rood (`--bad`) alleen voor "te laat"/fout. Geen kleur per persoon, fase of soort.
- Geen gradients, geen gloed-schaduwen, geen pastel-stickies. Enige uitzondering: een fade over een foto zodat tekst erop leesbaar is (markeer de regel met `/* cover-scrim */`).

## Typografie
- IBM Plex Sans voor tekst, Plex Sans Condensed (`--font-display`) voor titels en sectiekoppen.
- Titels klein houden (h1 1.65rem, mobiel 1.4rem; sectiekop 1.15rem). Cijfers `tabular-nums`.
- Geen accentwoord in koppen ("Welkom **terug.**"), geen hoofdletter-kickers, geen marketingzinnen.

## Iconen en beweging
- Alleen `<Icon>` uit `lib/icons.tsx`. Geen ✓ ☐ ✦ ✈ of emoji als icoon; geen sparkle-icoon voor "AI".
- Laden = de gewone spinner (`Orb` rendert `.spin`). Geen geanimeerde orbs, geen scheve kaartjes (alleen rotaties van 90°).

## Tekst
- Kort en concreet, Nederlands; i18n vertaalt (`lib/i18n.ts`).
- Geen toast voor iets dat je al ziet veranderen. Wel bij fouten en bij acties buiten beeld (mail verstuurd).
- Scores en tellingen als gewone cijfers; alleen een lage score krijgt kleur.
