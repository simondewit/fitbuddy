# Architectuur

Hoe FitBuddy in elkaar zit, en hoe je de meest voorkomende aanpassingen doet.

## De lagen

```
Schermen (src/app)
   │ gebruiken
Hooks (src/data)  ──── Opslag (src/store)
   │ gebruiken
Bronnen (src/health)        Poppetje (src/avatar)
   │ leveren DayValues          │ gebruikt
Kernlogica (src/core)  ◄────────┘
```

De kernlogica weet niets van telefoons, schermen of opslag. Daardoor is hij volledig te testen en kun je de scoreregels veranderen zonder iets anders te raken.

Een dag gaat zo door de app:

1. `useHealthDays` (in `src/data`) vraagt de actieve bron om de waarden van een dag.
2. De bron (Apple Gezondheid, Health Connect of demo) levert een `DayValues`-object: per signaal een getal, of `null` als er geen data is.
3. Het handmatig gelogde water wordt erbij opgeteld.
4. `computeScore` (in `src/core/score.ts`) maakt er een score van 0 tot 100 van.
5. Het scherm toont de score, het label, de drie kerncijfers en een gedachte uit `src/core/lines.ts`.
6. Het poppetje krijgt de score als getal tussen 0 en 1 en tekent de bijbehorende uitdrukking.

De opgehaalde dagen worden bewaard in de opslag, zodat de app bij het openen meteen iets laat zien en daarna ververst.

## De score

De regels staan in `src/core/signals.ts` (doelen en gewichten) en `src/core/score.ts` (berekening).

- Per signaal: `ratio = clamp(waarde / doel, 0, 1)` en `punten = ratio × gewicht`.
- Rusthartslag telt omgekeerd: 55 bpm of lager is vol, 72 of hoger is nul.
- Een signaal zonder data (`null`) telt niet mee. De gewichten van de overige signalen worden opgeschaald zodat het maximum 100 blijft. Zo krijgt iemand zonder horloge geen straf voor ontbrekende HRV.
- Een gemeten 0 telt wel mee.
- Signalen die de gebruiker in Instellingen uitzet, tellen ook niet mee.

Herstel (Goed, Prima, Matig, Laag) is het gemiddelde van de ratio's van slaap, HRV en rusthartslag.

### Bekende keuze: de score van vandaag loopt op

Stappen, workouts, energie en water tellen op over de dag. 's Ochtends is de score dus lager dan 's avonds. Dat is nu bewust zo, omdat het de gebruiker aanspoort. Wil je dat anders, dan is `computeScore` de plek: je kunt bijvoorbeeld het doel van optellende signalen laten meeschalen met het uur van de dag.

### Bekende keuze: HRV op iPhone en Android verschilt

Apple meet HRV als SDNN, Android als RMSSD. Die getallen liggen niet op dezelfde schaal. Het doel is nu voor beide 60 ms. Na een paar weken echte data kun je per platform een ander doel kiezen in `src/core/signals.ts`.

## Het poppetje

Het poppetje bestaat uit twee lagen, zoals de prompt vraagt.

- `src/avatar/params.ts` zet de score om in parameters: hoe ver de mond lacht, hoe ver de oogleden zakken, hoe sterk de wallen zijn, enzovoort. Deze formules komen letterlijk uit `docs/design/avatar.js`.
- `src/avatar/Pip.tsx` tekent die parameters met SVG. Pip heeft zelf geen logica.
- `src/avatar/Avatar.tsx` regelt het leven: ademhalen, knipperen en vloeiend overgaan naar een nieuwe score. Als de gebruiker "beweging verminderen" aan heeft staan, staat het poppetje stil.

### Een nieuw poppetje toevoegen

1. Kopieer `Pip.tsx` naar bijvoorbeeld `Mochi.tsx` en teken een ander figuur. Gebruik dezelfde parameters (`p.smile`, `p.tired`, `p.bags`, enz.), zodat het nieuwe figuur ook blij, moe en uitgeput kan kijken.
2. Voeg het toe aan de lijst in `src/avatar/registry.ts`.
3. Het verschijnt vanzelf in de onboarding, in Instellingen en in de Speeltuin.

Gebruik de Speeltuin (Bronnen › Instellingen › Speeltuin) om alle uitdrukkingen te controleren.

## Databronnen

Elke bron implementeert de interface in `src/health/types.ts`.

| Bestand | Wanneer |
|---|---|
| `appleHealth.ios.ts` | iPhone, eigen build |
| `healthConnect.android.ts` | Android, eigen build |
| `demo.ts` | Browser, Expo Go, of als de gebruiker demodata aanzet |
| `appleHealth.ts`, `healthConnect.ts` | Lege versies voor platforms waar de bron niet bestaat |

Metro (de bundler) kiest automatisch het `.ios.ts`- of `.android.ts`-bestand. `sources.ts` laadt de native bron pas als die echt nodig is, zodat Expo Go en de browser niet crashen.

Belangrijke details in de bronnen:

- Slaap telt over de nacht vóór de dag, van 18:00 tot 14:00. Overlappende metingen (telefoon en horloge) tellen één keer, via `unionDurationMs` in `src/core/time.ts`.
- Stappen en energie komen uit statistiek-query's, die dubbele bronnen zelf ontdubbelen.
- Elke query is apart afgeschermd. Faalt er één, dan is alleen dat signaal leeg.
- Apple vertelt nooit of iemand toestemming weigerde. Een geweigerd signaal ziet eruit als "geen data".

### Een nieuwe bron toevoegen (bijvoorbeeld Strava)

1. Maak `src/health/strava.ts` dat `HealthSource` implementeert.
2. Strava vraagt een server voor het inloggen, omdat het client secret niet in de app mag staan. Een Supabase Edge Function of Cloudflare Worker is genoeg.
3. Bewaar tokens met `expo-secure-store`, niet in de gewone opslag.
4. Combineer de bron in `useHealthDays`: tel workout-minuten op, of neem het maximum om dubbeltellen te voorkomen met workouts die al via Apple Gezondheid binnenkomen.
5. Let op: een nieuwe Strava-app mag maar één atleet koppelen tot Strava de app goedkeurt.

## Een signaal toevoegen

1. Voeg de sleutel toe aan `SignalKey` en een regel aan `SIGNALS` in `src/core/signals.ts`. Pas de gewichten aan zodat ze samen 100 blijven (de test controleert dat).
2. Voeg twee zinnen toe aan `SIGNAL_LINES` in `src/core/lines.ts`.
3. Voeg opmaak toe in `formatSignal` in `src/core/format.ts` en een uitleg in `EXPLAIN` in `src/app/detail/[signal].tsx`.
4. Lees het signaal uit in `appleHealth.ios.ts` en `healthConnect.android.ts`, en voeg het toe aan de toestemmingen. Voor Android ook aan `android.permissions` in `app.json`.
5. Draai `npm run check`.

## Een scherm toevoegen

Maak een bestand in `src/app/`. De bestandsnaam is de route: `src/app/stats.tsx` wordt `/stats`. Voeg het scherm toe aan de `Stack` in `src/app/_layout.tsx` als het een titel of terugknop nodig heeft. Navigeer ernaartoe met `router.push('/stats')`.

## Opslag

Alles staat in `src/store/settings.ts`, bewaard met AsyncStorage op het toestel. Er is geen account en geen server. De opslag houdt maximaal 60 dagen aan water en gecachte dagen bij.

Verander je de vorm van de opgeslagen data, verhoog dan `version` in de `persist`-instellingen en voeg een `migrate`-functie toe. Anders kunnen bestaande gebruikers vastlopen na een update.

## Testen

- `npm test` draait alle tests (Jest).
- Tests staan naast de code in `__tests__`-mappen.
- De kernlogica heeft de meeste tests. Pas je de score aan, schrijf dan eerst een test die beschrijft wat je verwacht.
