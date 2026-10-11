# Releasegids

Van code naar je telefoon, en daarna naar de App Store en Google Play. Je hebt geen Mac nodig: Expo bouwt de app in de cloud (EAS).

Kosten: Apple Developer Program 99 dollar per jaar, Google Play Console 25 dollar eenmalig, Expo gratis (tot 15 iOS- en 15 Android-builds per maand op het gratis plan).

## 0. Eenmalige voorbereiding

1. Maak een gratis account op [expo.dev](https://expo.dev/signup).
2. Log in op je computer en koppel het project:
   ```sh
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   `init` zet een `projectId` in `app.json`. Commit die wijziging.
3. Kies je eigen app-ID. Die staat nu op `nl.simondewit.fitbuddy` in `app.json` (`ios.bundleIdentifier` en `android.package`). Na de eerste publicatie kun je dit niet meer veranderen.
4. Zet het privacybeleid online (zie stap 5) en controleer de URL in `src/config.ts`.

## 1. De app op je eigen iPhone (met echte data)

Expo Go kan niet bij Apple Gezondheid. Daarom maak je een eigen ontwikkelversie.

1. Registreer je iPhone:
   ```sh
   npx eas-cli@latest device:create
   ```
   Open de link op je iPhone en volg de stappen.
2. Bouw de ontwikkelversie:
   ```sh
   npx eas-cli@latest build --profile development --platform ios
   ```
   EAS vraagt om in te loggen met je Apple-ID en regelt certificaten zelf. De build duurt 10 tot 20 minuten. Zet daarna in de iOS-instellingen de ontwikkelaarsmodus aan als daarom gevraagd wordt (Instellingen › Privacy en beveiliging › Ontwikkelaarsmodus).
3. Installeer de app via de link of QR-code die EAS geeft.
4. Start de ontwikkelserver en open de app:
   ```sh
   npm start
   ```
5. Doorloop de onboarding en kies "Koppel Apple Gezondheid".

Je hoeft alleen opnieuw te bouwen als je een bibliotheek met native code toevoegt of `app.json` aanpast. Voor gewone codewijzigingen is `npm start` genoeg.

## 2. De app op een Android-telefoon (met echte data)

1. Installeer Health Connect uit de Play Store als je Android-versie ouder is dan 14.
2. Bouw een testversie:
   ```sh
   npx eas-cli@latest build --profile development --platform android
   ```
3. Installeer de APK via de link en start `npm start`.

Zonder Google-goedkeuring werkt Health Connect al op je eigen testtoestel. Voor publicatie is goedkeuring nodig, zie stap 4.

## 3. Publiceren in de App Store

1. Maak een productiebuild:
   ```sh
   npx eas-cli@latest build --profile production --platform ios
   ```
2. Stuur hem naar Apple:
   ```sh
   npx eas-cli@latest submit --platform ios
   ```
   De eerste keer maakt EAS de app aan in App Store Connect. Na 10 tot 15 minuten staat de build in TestFlight. Daar kun je hem zelf en met anderen testen.
3. Vul in [App Store Connect](https://appstoreconnect.apple.com) de vermelding in. Alle teksten staan in [STORE.md](STORE.md):
   - naam, ondertitel, beschrijving, trefwoorden
   - categorie: Gezondheid en fitness
   - privacybeleid-URL
   - privacylabels: kies "Gegevens worden niet verzameld". FitBuddy stuurt niets van het toestel af, en Apple rekent alleen data die het toestel verlaat als "verzameld".
   - leeftijdsclassificatie: vragenlijst invullen, alles "nee"
   - schermafbeeldingen voor 6,9 inch (zie stap 6)
   - opmerkingen voor de reviewer, ook in STORE.md
4. Kies de build en klik op "Ter beoordeling indienen". Een review duurt meestal één tot drie dagen.

## 4. Publiceren in Google Play

1. Maak een ontwikkelaarsaccount op [play.google.com/console](https://play.google.com/console). Google vraagt om identiteitsverificatie; dat kan een paar dagen duren.
2. Maak een nieuwe app aan in de Play Console met dezelfde package-naam als in `app.json`.
3. Maak een Google Service Account-sleutel zodat EAS namens jou kan uploaden. Volg [deze gids](https://expo.fyi/creating-google-service-account) en voeg de sleutel toe in het EAS-dashboard.
4. Bouw en verstuur:
   ```sh
   npx eas-cli@latest build --profile production --platform android
   npx eas-cli@latest submit --platform android
   ```
   De eerste upload komt op het interne testkanaal.
5. Vul de storevermelding in met de teksten uit STORE.md.
6. Health Connect-verklaring: in de Play Console onder Beleid › App-content vul je per datatype in waarom de app het leest. De teksten staan in STORE.md. Goedkeuring kan tot een week duren, en daarna nog een week voordat het werkt.
7. Gegevensveiligheid: vul in dat de app gezondheidsgegevens verwerkt, maar niet deelt en niet verzamelt (alles blijft op het toestel).
8. Let op voor persoonlijke ontwikkelaarsaccounts: Google eist dat je eerst een gesloten test draait met minstens 12 testers gedurende 14 dagen, voordat je naar productie mag. Controleer de actuele eis in de Play Console, die verandert soms.

## 5. Privacybeleid online zetten

Het privacybeleid staat in `docs/privacy.html`. Zet het online met GitHub Pages:

1. Ga op GitHub naar de repository › Settings › Pages.
2. Kies "Deploy from a branch", branch `main`, map `/docs`.
3. Na een minuut staat het op `https://<gebruikersnaam>.github.io/fitbuddy/privacy.html`.
4. Zet die URL in `src/config.ts` en in beide stores.

Is je repository privé, dan vraagt GitHub Pages een betaald plan. Een openbare Notion-pagina of elke andere gratis webpagina met dezelfde tekst werkt ook.

## 6. Schermafbeeldingen

Apple vraagt schermafbeeldingen van 1320 × 2868 pixels (6,9 inch). Google vraagt minimaal twee, staand, bijvoorbeeld 1080 × 1920.

Makkelijkste manier: zet op je telefoon Demodata aan (Bronnen › Demodata) en maak schermafbeeldingen van het hoofdscherm, het weekoverzicht, een detailscherm en de speeltuin. Demodata geeft elke dag dezelfde mooie waarden, zodat je ze opnieuw kunt maken.

## 7. Updates uitbrengen

Kleine wijzigingen in de code (teksten, kleuren, logica) kun je zonder nieuwe review naar gebruikers sturen:

```sh
npx eas-cli@latest update --channel production --message "Wat er veranderd is"
```

Om dit te gebruiken, voer je eenmalig `npx eas-cli@latest update:configure` uit en maak je daarna een nieuwe productiebuild.

Wijzigingen in `app.json`, nieuwe toestemmingen of nieuwe native bibliotheken vragen wel een nieuwe build en review. Verhoog dan `version` in `app.json` (bijvoorbeeld van 1.0.0 naar 1.1.0). Het buildnummer telt EAS zelf op.

## 8. Als er iets misgaat

| Probleem | Oplossing |
|---|---|
| Build faalt | Open de link naar de buildlog. Draai `npx expo-doctor` en `npm run check` lokaal. |
| App crasht bij openen in Expo Go | Normaal als je native code toevoegt. Gebruik een development build. |
| Geen data uit Apple Gezondheid | Gezondheid-app › profiel › Apps › FitBuddy: staan de schuifjes aan? |
| Geen data uit Health Connect | Instellingen › Health Connect › App-machtigingen › FitBuddy. Is Health Connect bijgewerkt? |
| Apple wijst de app af om HealthKit | Controleer of de reviewer-opmerkingen uit STORE.md zijn ingevuld en of het privacybeleid bereikbaar is. |
| Versies van bibliotheken passen niet | `npx expo install --fix` |
| Nieuwe Expo-versie | Volg de upgradegids op [docs.expo.dev](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), één SDK-versie per keer. |
