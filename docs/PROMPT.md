# Prompt voor Claude Code — Gezondheids-avatar app

Bouw een iOS-app (SwiftUI, iOS 17+) die mijn gezondheid zichtbaar maakt via een schattig, getekend poppetje. Het idee: in één oogopslag zien of ik goed in mijn fysieke vel zit. Het poppetje laat dat zien met zijn gezichtsuitdrukking en houding, en zegt er iets grappig-brutaals over in een spraakwolkje. Het mag licht aanvoelen als een game, maar de interface blijft modern, clean en rustig. Weinig informatie, één duidelijke boodschap.

Het meegeleverde bestand `Gezondheid Avatar Dashboard.html` is het design. Sectie **2** (dashboard 2a + expressieblad 2b) is de gekozen richting. Sectie 1 (pixel/retro) is verworpen: niet gebruiken.

## Kernconcept

- Eén **vitaliteitsscore van 0–100**: "hoe goed zit ik in mijn vel vandaag".
- Het **poppetje reflecteert die score traploos** (geen 3 losse plaatjes, maar parameters die vloeiend meeschalen).
- Een **spraakwolkje** met één korte, grappige, licht brutale zin in het Nederlands, passend bij de score.
- Daaronder alleen **drie kerncijfers**: Slaap, Beweging, Herstel. Geen grids met 8 tegels, geen grafieken op het hoofdscherm.

## Hoofdscherm (zie 2a)

Van boven naar beneden, gecentreerd, veel witruimte, warme off-white achtergrond (`#f7f3ea`):
1. Twee kleine pill-knoppen: links "Vandaag" (datum kiezen), rechts "Bronnen" (koppelingen).
2. Spraakwolkje (wit, afgerond, klein staartje naar het poppetje).
3. Het poppetje, groot (~250 pt breed), ademt zachtjes en knippert af en toe.
4. De score groot en vet (~90 pt, tabular figures).
5. Dunne voortgangsbalk (6 pt), kleur loopt van rood (laag) via geel naar groen (hoog), oklch hue 25→150.
6. Label onder de balk: Topvorm (≥85) / Goed in je vel (≥65) / Gaat wel (≥45) / Op reserve (≥25) / Uitgeput.
7. Dunne scheidingslijn, daarna drie kolommen: Slaap (bv. "7u12"), Beweging (stappen, "8.412"), Herstel (Goed / Prima / Matig / Laag).

Font: Geist (of SF Pro als fallback). Inkt `#1c1b18`, secundaire tekst `#8b8478`.

## Het poppetje (belangrijkste onderdeel, zie 2b)

Een vector-figuurtje: groot hoofd, klein lijfje, korte beentjes, donkere contourlijn (`#3b2a22`, ~4 pt). Bouw het als SwiftUI `Shape`s / `Canvas` zodat alles animeerbaar is. Neem de exacte geometrie en de parameterlogica over uit `avatar.js` in het project (functie `render(h)`, h = 0..1).

Parameters die van de score afhangen:
- **Mond**: lach → neutraal → frons. Boven ~0,55 een open lach met tongetje.
- **Oogleden**: zakken steeds verder over de ogen naarmate de score daalt (moe).
- **Wallen**: paarsige boogjes + schaduw onder de ogen, sterker bij lage score.
- **Wenkbrauwen**: binnenkant omhoog = bezorgd bij lage score, ontspannen/opgetrokken bij hoge score.
- **Rimpels**: voorhoofdsrimpels en kraaienpootjes verschijnen onder ~48.
- **Huidskleur**: van gezond perzik naar vaal/grauw.
- **Houding**: hoofd zakt iets en kantelt bij lage score; armpjes hangen meer.
- **Blosjes en glimmende ogen** bij hoge score.
- **Zweetdruppel en wilde haren** onder ~30.
- **Animatie**: ademhaling (sneller en lichter bij hoge score), knipperen. Score-veranderingen vloeiend animeren.

Later uitbreidbaar: meerdere avatars om uit te kiezen (bv. een vrouw, een dier). Houd de parameterlaag los van de tekening.

## Data en score

Bronnen: **Apple HealthKit** (iPhone + Apple Watch of andere gekoppelde smartwatch) en **Strava** (OAuth, workouts). Water handmatig te loggen.

Signalen + gewicht in de vitaliteitsscore (som = 100):
- Slaap (doel 8u): 20
- Stappen (doel 10.000): 15
- Workout-minuten, Strava/HealthKit (doel 30): 15
- Rusthartslag (lager is beter, doel ≤55 bpm, 72+ = 0): 10
- HRV (doel 60 ms): 10
- Water (doel 2,5 L): 10
- Actieve energie (doel 600 kcal): 10
- Mindful-minuten (doel 10): 10

Per signaal: `ratio = clamp(waarde / doel, 0, 1)`, punten = `ratio × gewicht`. Score = som. Maak doelen en gewichten later instelbaar.

De drie kerncijfers op het hoofdscherm: Slaap (uren), Beweging (stappen), Herstel (afgeleid van HRV + rusthartslag + slaap → Goed/Prima/Matig/Laag).

## Spraakwolkjes

Toon: grappig, een beetje brutaal, kort, Nederlands. Voorbeelden per scoreband:
- ≥85: "Ik voel me onoverwinnelijk. Wie gaat er mee hardlopen?"
- ≥65: "Lekker bezig. Nog één glas water en ik ben helemaal blij."
- ≥45: "Gaat wel. Een wandeling zou me goed doen, hint hint."
- ≥25: "Die wallen heb ik van jou, hoor. Vroeg naar bed vanavond?"
- <25: "Ik ben op. Echt op. Slapen, water, en dan praten we verder."

Bonus: laat de zin verwijzen naar het zwakste signaal van vandaag (bv. weinig water → "Ik ben in feite een rozijn."). Tik op het wolkje voor een volgende gedachte.

## Overige schermen (eenvoudig houden, zelfde stijl)

- **Onboarding**: welkom → avatar kiezen → bronnen koppelen (HealthKit-toestemming, Strava-login).
- **Bronnen/Koppelingen**: status per bron, aan/uit, laatste sync.
- **Week**: per dag de score + een mini-poppetje met de uitdrukking van die dag.
- **Detail** (optioneel, via tik op een kerncijfer): waarde, doel, 7-daags verloop.

## Technisch

- SwiftUI, MVVM. HealthKit-queries voor slaap, stappen, rusthartslag, HRV, actieve energie, mindful minutes, water, workouts. Strava API v3 via OAuth2, tokens in de Keychain.
- Achtergrond-refresh en een widget (klein: poppetje + score) als volgende stap.
- Een debug-slider (zoals in het design) om de score handmatig te simuleren.
- Alle teksten in het Nederlands.

Begin met: het datamodel + de scoreberekening met mockdata, dan het poppetje als animeerbare SwiftUI-view met een preview-slider, dan het hoofdscherm. Daarna pas HealthKit en Strava.
