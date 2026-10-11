# Teksten voor de stores

Alles wat je moet invullen in App Store Connect en de Google Play Console. Pas gerust aan.

## Naam en korte tekst

| Veld | Tekst |
|---|---|
| Naam | FitBuddy |
| Ondertitel (Apple, max 30) | Je gezondheid met een gezicht |
| Korte beschrijving (Google, max 80) | Eén score en een poppetje dat laat zien hoe je erbij staat. |
| Categorie | Gezondheid en fitness |
| Trefwoorden (Apple, max 100) | gezondheid,slaap,stappen,herstel,hrv,vitaliteit,welzijn,water,hartslag,avatar |

## Beschrijving

```
Hoe zit je vandaag in je vel? FitBuddy laat het in één oogopslag zien.

Je slaap, stappen, workouts, hartslag, HRV, water, actieve energie en mindful minuten worden samen één vitaliteitsscore van 0 tot 100. Je maatje Pip laat die score zien: stralend en lachend als het goed gaat, met wallen en hangende schouders als je op reserve draait.

En Pip zegt er ook wat van. Kort, eerlijk en een beetje brutaal. Weinig water gedronken? "Ik ben in feite een rozijn."

- Eén score, één poppetje, drie kerncijfers: slaap, beweging en herstel
- Weekoverzicht met de uitdrukking van elke dag
- Water loggen met één tik
- Werkt met Apple Gezondheid en Health Connect, dus ook met je Apple Watch, Garmin, Fitbit, Samsung of Strava
- Je kiest zelf welke signalen meetellen

Privacy
Je gezondheidsgegevens blijven op je telefoon. Geen account, geen server, geen reclame.

FitBuddy is geen medisch hulpmiddel en geeft geen medisch advies.
```

## Opmerkingen voor de reviewer (Apple)

```
FitBuddy reads HealthKit data (sleep, steps, workouts, resting heart rate, HRV, water, active energy, mindful minutes) to compute a daily wellbeing score shown by an animated character. All processing happens on-device. The app has no backend, no account and does not write to HealthKit.

To review without health data: on the last onboarding step tap "Eerst rondkijken met demodata" (explore with demo data), or toggle "Demodata" under Bronnen (Sources). The HealthKit permission prompt appears when tapping "Koppel Apple Gezondheid".

The app is not a medical device and shows a disclaimer in onboarding and under Bronnen › Over FitBuddy.
```

## Health Connect-verklaring (Google)

Per datatype vraagt Google waarom de app het leest. Gebruik deze teksten:

| Datatype | Reden |
|---|---|
| Stappen | Onderdeel van de dagelijkse vitaliteitsscore (beweging). |
| Slaap | Onderdeel van de vitaliteitsscore en de herstelindicator. |
| Training (ExerciseSession) | Aantal workout-minuten per dag voor de vitaliteitsscore. |
| Rusthartslag | Onderdeel van de herstelindicator en de vitaliteitsscore. |
| Hartslagvariabiliteit | Onderdeel van de herstelindicator en de vitaliteitsscore. |
| Hydratatie | Waterinname per dag voor de vitaliteitsscore. |
| Actief verbrande calorieën | Onderdeel van de vitaliteitsscore (beweging). |
| Mindfulness | Mindful minuten per dag voor de vitaliteitsscore. |

Algemene toelichting: "FitBuddy toont de gebruiker één dagelijkse vitaliteitsscore op basis van zijn gezondheidsgegevens, gevisualiseerd door een geanimeerd figuurtje. Gegevens worden alleen gelezen, uitsluitend op het toestel verwerkt, niet gedeeld en niet naar een server gestuurd."

## Privacy-antwoorden

| Vraag | Apple | Google |
|---|---|---|
| Verzamelt de app gegevens? | Nee ("Gegevens worden niet verzameld") | Nee |
| Deelt de app gegevens? | Nee | Nee |
| Versleuteling (export compliance) | Geen niet-vrijgestelde versleuteling (staat al in `app.json`) | n.v.t. |
| Reclame | Nee | Nee |
| Doelgroep | 13+ | 13+ |
