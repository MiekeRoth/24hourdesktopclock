# 24-uurs Klok / 24-Hour Clock

[Nederlands](#nederlands) | [English](#english)

---

## Nederlands

Een lichte, overzichtelijke 24-uurs bureaubladwidget die altijd bovenop andere vensters blijft zweven (*always-on-top*). Ontworpen om in één oogopslag grip te houden op het verloop van de dag en geplande momenten.

### Nieuw in versie 1.1
* **Automatisch opstarten:** Optie toegevoegd om de app direct met Windows mee te laten starten.
* **Instelbare waarschuwingstijd:** Kies zelf hoeveel minuten van tevoren de afteller verschijnt (1 tot 120 minuten).
* **Minimaliseren & Flexibel venster:** Nieuwe knop om de app naar de taakbalk te minimaliseren. Het venster schaalt nu ook automatisch soepel mee met de inhoud.

### Functies
* **Twee weergaven:** Wissel direct tussen een ronde 24-uurs klok en een horizontale 24-uurs tijdbalk.
* **Eigen momenten:** Voeg vaste momenten toe (zoals etenstijd, medicijnen of bedtijd) die lokaal bewaard blijven en ook na middernacht doorlopen.
* **Afteller & meldingen:** Telt af in minuten en geeft op het ingestelde tijdstip een rustig geluidssignaal en bureaubladmelding.
* **Compact & randloos:** Vrij versleepbaar over het scherm, voorzien van hover-labels op de markeringen.
* **Tweetalig:** Kies via het tandwiel-icoon rechtsboven tussen Nederlands en Engels.

### Installatie (Windows)
1. Ga op deze pagina naar **Releases** en download het `.exe`-installatiebestand (of het `.msi`-pakket).
2. Start het gedownloade bestand.
3. *Let op:* Omdat de app niet commercieel is ondertekend, toont Windows mogelijk een blauwe SmartScreen-melding (*"Windows heeft uw pc beschermd"*). Klik op **Meer informatie** en daarna op **Toch uitvoeren**.

### Zelf bouwen vanuit de broncode
Deze app is gebouwd met [Tauri v2](https://v2.tauri.app/) (Rust + TypeScript). Zorg dat **Node.js**, **Rust** en de Tauri-systeemvereisten zijn geïnstalleerd:

```bash
# Installeer de afhankelijkheden
npm install

# Start in ontwikkelmodus
npm run tauri dev

# Bouw het installatiebestand
npm run tauri build
```

---

## English

A lightweight, clean 24-hour desktop widget that stays on top of other windows (*always-on-top*). Designed to provide an intuitive visual overview of the entire day and upcoming daily events.

### New in version 1.1
* **Autostart:** Added an option to automatically launch the app when Windows starts.
* **Adjustable warning time:** Customize how many minutes in advance the countdown appears (1 to 120 minutes).
* **Minimize & Flexible window:** Added a minimize-to-taskbar button. The window height now automatically adjusts to fit the content.

### Features
* **Dual views:** Switch seamlessly between a circular 24-hour clock and a horizontal 24-hour timeline bar.
* **Custom event markers:** Add daily moments (such as meals, medication, or bedtime) stored locally and persisting across midnight.
* **Countdown & alerts:** Displays a minute-by-minute countdown starting 15 minutes ahead, and triggers a gentle chime plus a desktop notification when the time arrives.
* **Compact & borderless:** Freely draggable anywhere on screen, with hover tooltips on all markers.
* **Bilingual UI:** Switch between English and Dutch via the gear icon in the top-right corner.

### Installation (Windows)
1. Open the **Releases** section on this repository and download the `.exe` installer (or `.msi` package).
2. Run the downloaded installer.
3. *Note:* Because this open-source build is not signed with a commercial certificate, Windows SmartScreen may show a warning (*"Windows protected your PC"*). Click **More info** and then **Run anyway**.

### Building from Source
Built with [Tauri v2](https://v2.tauri.app/) (Rust + TypeScript). Make sure **Node.js**, **Rust**, and the Tauri system prerequisites are installed:

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build the release installer
npm run tauri build
```

---

## Licentie / License

Dit project is uitgebracht onder de [MIT-licentie](LICENSE) / This project is licensed under the [MIT License](LICENSE).