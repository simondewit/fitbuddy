# Bouwplan FitBuddy (werktitel)

Een gezondheidsapp voor iPhone en Android met een getekend poppetje dat laat zien hoe je erbij staat. Dit plan is geschreven voor iemand die de app bouwt en onderhoudt zonder hulp van een AI. Het bronmateriaal staat in `docs/design/` (het Claude Design-bestand, `avatar.js` en `data.js`) en `docs/PROMPT.md`.

## 1. Keuze van techniek

De oorspronkelijke prompt vraagt om SwiftUI. Dat werkt alleen op iPhone. Omdat de app ook op Android moet draaien, kiezen we één codebase voor beide.

| Optie | Waarom wel | Waarom niet |
|---|---|---|
| Expo (React Native, TypeScript) | Het design is al SVG + JavaScript, het poppetje en de scorelogica gaan bijna één op één over. Bouwen en publiceren via EAS kan zonder Mac. Grootste ecosysteem, makkelijk een ontwikkelaar voor te vinden. | Toegang tot HealthKit en Health Connect gaat via community-libraries. |
| Flutter (Dart) | Snel en strak getekend. | Poppetje en logica moeten volledig herschreven worden. Kleinere pool ontwikkelaars. |
| Twee native apps (Swift + Kotlin) | Maximale controle. | Alles twee keer bouwen en onderhouden. |

Advies: Expo met TypeScript. Dat is ook de keuze waarbij iemand anders het werk het makkelijkst overneemt.

Gebruikte bouwstenen (allemaal breed gebruikt en goed gedocumenteerd):

- Expo SDK (laatste stabiele versie) met Expo Router voor navigatie
- `react-native-svg` voor het poppetje, `react-native-reanimated` voor ademen, knipperen en vloeiende overgangen
- `@kingstinct/react-native-healthkit` voor Apple Health
- `react-native-health-connect` voor Android Health Connect
- `zustand` met AsyncStorage voor app-state, opslag lokaal op het toestel
- later voor Strava: `expo-secure-store` voor tokens (Keychain op iOS, Keystore op Android)
- Jest voor tests, ESLint en TypeScript strict voor codekwaliteit
- EAS Build, EAS Submit en EAS Update voor bouwen, publiceren en kleine fixes zonder nieuwe store-review

## 2. Opbouw van de code

De code is in lagen opgedeeld, zodat elke laag los te testen en te vervangen is.

```
src/
  core/        Pure logica zonder telefoonafhankelijkheden: signalen, doelen,
               gewichten, scoreberekening, herstel, labels, spraakwolkjes.
               Volledig gedekt door unit tests.
  avatar/      params.ts zet een score (0..1) om naar parameters
               (mond, oogleden, wallen, houding...). Pip.tsx tekent die
               parameters. Een nieuw poppetje is een nieuw tekenbestand
               dat dezelfde parameters gebruikt.
  health/      Eén interface HealthSource met implementaties per bron:
               HealthKit (iOS), Health Connect (Android), Mock, later Strava.
  store/       App-state en lokale opslag: instellingen, waterlog,
               dagscores voor het weekoverzicht.
    data/        Hooks die bron, opslag en score aan elkaar knopen.
  ui/          Kleuren, typografie, knoppen, spraakwolk, voortgangsbalk.
  app/         Schermen (Expo Router): onboarding, vandaag, week,
               detail, bronnen, instellingen, speeltuin.
```

De scoreformule staat precies zoals in de prompt: per signaal `ratio = clamp(waarde / doel)`, punten = `ratio × gewicht`, totaal 100. Rusthartslag telt omgekeerd (55 bpm of lager is vol, 72 of hoger is nul). Doelen en gewichten staan in één configuratiebestand, zodat ze later instelbaar worden zonder de formule aan te raken.

Ontbrekende data verdient aandacht. Iemand zonder smartwatch heeft geen HRV en geen rusthartslag. Als een signaal geen bron heeft, schalen we de overige gewichten op naar 100, anders blijft de score voor die gebruiker kunstmatig laag. Een signaal dat wel een bron heeft maar vandaag nul is (bijvoorbeeld nog geen water gelogd), telt gewoon als nul.

Apple meet HRV als SDNN, Android als RMSSD. Die getallen liggen niet op dezelfde schaal. We beginnen met hetzelfde doel van 60 ms en zetten het doel per platform in de config, zodat het later bij te stellen is.

## 3. Fasen

Elke fase eindigt met iets dat werkt en getest is.

| Fase | Inhoud | Resultaat |
|---|---|---|
| 0 | Accounts aanmaken: Apple Developer (99 dollar per jaar), Google Play Console (25 dollar eenmalig), Expo-account (gratis). | Je kunt builds maken en publiceren. |
| 1 | Projectopzet, linting, CI op GitHub. Kernlogica met mockdata en tests. | `npm test` groen. |
| 2 | Poppetje als animeerbare component, met een debugscherm met schuifbalk. | Poppetje reageert traploos op de score. |
| 3 | Hoofdscherm, weekscherm, detailscherm, met mockdata. | App is volledig te bekijken in Expo Go en in de browser. |
| 4 | Koppeling met Apple Health en Health Connect, toestemmingen, water handmatig loggen. | Echte data op een echte telefoon (development build). |
| 5 | Onboarding, bronnenscherm, instellingen, lege en foutstaten. | App is af voor een eerste gebruiker. |
| 6 | Store-voorbereiding: icoon, splash, schermafbeeldingen, privacybeleid, disclaimer, teksten. | TestFlight en interne test op Google Play. |
| 7 | Later: Strava, widget, achtergrondverversing, meer poppetjes, instelbare doelen. | |

## 4. Robuustheid

- TypeScript strict en ESLint, CI draait lint, typecheck en tests op elke push.
- De kernlogica heeft geen telefoonafhankelijkheden en is volledig getest.
- Elke databron kan falen of leeg zijn. De app toont dan een nette lege staat, nooit een crash.
- Crashrapportage via Sentry (optioneel, gratis tier), zodat je fouten ziet bij gebruikers.
- EAS Update voor kleine fixes in JavaScript zonder nieuwe store-review.
- Versienummers en buildnummers worden door EAS automatisch opgehoogd.

## 5. Eisen van Apple en Google

Gezondheidsapps krijgen extra aandacht bij de review. Dit moet op orde zijn:

- Een privacybeleid op een openbare URL. We hosten het gratis via GitHub Pages vanuit deze repo.
- Duidelijke teksten bij de toestemmingsvragen (waarom we slaap, stappen, hartslag lezen).
- Gezondheidsdata verlaat het toestel niet en wordt niet voor reclame gebruikt. Dat maakt de privacylabels in beide stores simpel.
- Een disclaimer dat de app geen medisch advies geeft.
- Google Play vraagt een aparte verklaring voor Health Connect-toegang, met per datatype een reden. De teksten daarvoor staan klaar in `docs/STORE.md`.
- Bij Apple een HealthKit-entitlement, dat EAS automatisch instelt via de config.

## 6. Strava

Strava is lastiger dan het lijkt. Een nieuwe Strava-app mag standaard maar één atleet koppelen tot Strava de app goedkeurt. Het inwisselen van de login-code vraagt een geheime sleutel, die niet in de app zelf mag staan, dus daarvoor is een klein servertje nodig (bijvoorbeeld een Supabase Edge Function). Strava-workouts komen bij de meeste mensen al in Apple Health of Health Connect terecht via hun horloge of de Strava-app zelf.

Advies: in versie 1 workouts uit Apple Health en Health Connect halen, en Strava als aparte bron in fase 7 toevoegen.

## 7. Documentatie voor wie verder bouwt

De repo krijgt naast deze planning:

- `README.md` met in tien minuten de app lokaal draaien
- `docs/ARCHITECTUUR.md` met hoe de lagen samenhangen en hoe je een signaal, scherm of poppetje toevoegt
- `docs/RELEASE.md` met stap voor stap bouwen, testen op je telefoon en publiceren in beide stores
- `docs/STORE.md` met alle teksten voor de store-vermeldingen en de review
- `docs/privacy.html` als privacybeleid

## 8. Wat ik in deze sessie kan en niet kan

Ik kan alle code schrijven, testen en de app in de browser laten draaien om het hoofdscherm en het poppetje te controleren. Ik kan geen native build op een telefoon draaien en niets in de stores zetten, want daarvoor zijn jouw Apple-, Google- en Expo-accounts nodig. Die stappen staan in `docs/RELEASE.md`, uitgeschreven zodat je ze zelf kunt doen.

## 9. Status

Gekozen op 11 oktober 2026: Expo, Strava later, alle data alleen op het toestel. Er is een Apple Developer-account; een Google Play-account nog niet.

| Fase | Status |
|---|---|
| 0 Accounts | Apple klaar. Google Play en Expo nog aanmaken. |
| 1 Opzet, CI, kernlogica | Klaar. 45 tests. |
| 2 Poppetje | Klaar, inclusief speeltuin met schuifbalk en expressieblad. |
| 3 Schermen | Klaar: vandaag, week, detail, bronnen, instellingen, over. |
| 4 Apple Gezondheid en Health Connect | Code klaar, nog niet getest op een echte telefoon. |
| 5 Onboarding, lege staten | Klaar. |
| 6 Store-voorbereiding | Icoon, splash, teksten, privacybeleid en releasegids klaar. Schermafbeeldingen en het online zetten van het privacybeleid nog doen. |
| 7 Strava, widget, achtergrond | Nog niet begonnen. |

Nog te doen voor de eerste release:

- Development build op een echte iPhone en Android-telefoon, en controleren of alle signalen binnenkomen (docs/RELEASE.md stap 1 en 2).
- Contactadres invullen in `docs/privacy.html` en het beleid online zetten.
- Op Android opent Health Connect de app als iemand in het toestemmingsscherm op "privacybeleid" tikt. Google wil dat de app dan het privacybeleid toont. Nu opent het hoofdscherm. Dit moet nog gekoppeld worden aan het scherm Over FitBuddy.
- Kiezen of de score van vandaag 's ochtends lager mag zijn omdat stappen en water nog oplopen (zie docs/ARCHITECTUUR.md).
