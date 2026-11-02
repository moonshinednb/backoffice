# Ontwerpregels Moonshine Backoffice

Een werktool voor zes mensen, vaak op de telefoon. Rustig, compact, taakgericht.
`backend/core/tests/test_design.py` bewaakt de harde regels (draait mee met `manage.py test`).

## Structuur
- **Sectie = kop op de achtergrond** (`.block` + `.block-head h2`), zonder kader. Items staan samen in één `.panel` als rijen (`.rows`) met haarlijnen. Een los kader alleen voor iets dat je op zichzelf bedient.
- Geen kaart-in-kaart, geen kolommenbord met kaartjes. Lijsten zijn rijen.
- **Paginakop**: één regel titel + acties rechts (`PageTitle`). Geen bovenkopje (eyebrow), geen beschrijvende ondertitel; alleen een ondertitel als die data draagt (datum, status).
- Filters: één `.seg` per scherm. Eén primaire knop per scherm.
- Lege staat: één regel (`.empty-line`), geen groot paneel met icoon en uitleg.

## Mobiel
- Onderbalk met Overzicht, Taken, Events, Meetings en Meer. Knoppen in de kop worden iconen.
- Eerst de inhoud: kop zo laag mogelijk, geen uitleg boven de lijst.

## Kleur
- Alleen tokens uit `frontend/src/styles/system.css` (`var(--…)`). Geen hex-kleuren elders (alleen puur zwart voor schaduwen).
- **Kleurbudget**: accent alleen voor de primaire actie en de actieve plek in de navigatie. Rood (`--bad`) alleen voor "te laat"/fout. Geen kleur per persoon, fase of soort.
- Geen gradients, geen gloed-schaduwen, geen pastel-stickies.

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
