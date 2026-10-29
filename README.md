# GainWell Calorie Tracker

A mobile-friendly Progressive Web App (PWA) for calorie/protein tracking, meal reminders, food photo notes, and weight-gain progress.

## Features
- Daily food diary with calories and protein totals
- Searchable starter database of common Indian foods
- Editable calories/protein for custom foods and portions
- Meal categories
- Food photo preview and photo-linked manual nutrition logging
- Daily weight log and progress toward 70 kg
- Meal reminder schedule and browser notifications
- Local persistence using `localStorage`
- Export data as JSON backup
- PWA installability and basic offline cache

## Run locally

Service workers and browser notifications need a secure context. `localhost` is allowed for local development; do not open `index.html` directly with `file://`.

### Option A: Python
1. Install Python 3 if needed.
2. Open a terminal in this folder.
3. Run:
   ```bash
   python -m http.server 8000
   ```
4. On the same computer, open `http://localhost:8000`.
5. To test on your phone on the same Wi-Fi, use your computer's LAN IP, for example `http://192.168.1.10:8000`. Notification/service-worker support generally requires HTTPS on non-localhost addresses, so use a hosted HTTPS URL for full phone testing.

### Option B: Node
If Node.js is installed, run:
```bash
npx serve .
```
Open the HTTPS or localhost address shown by the command.

## Deploy for phone + computer

Host the contents of this folder on any static host that provides HTTPS, such as GitHub Pages, Netlify, or Cloudflare Pages.

- Upload the files in this folder to your repository/site root.
- Open the deployed HTTPS URL on your phone.
- In Chrome on Android, use browser menu → **Install app** or **Add to Home screen**.
- In Safari on iPhone, use Share → **Add to Home Screen**. iOS web push requires a web app added to the Home Screen and a supported iOS version.
- Open the app and tap **Enable reminders**, then allow notifications.
- Set meal times and tap **Save schedule**.

## Important notification limitation

This starter implementation uses browser timers and notification permission. It can notify while the app is open and the browser lets its timers run. Browsers may suspend timers or stop them entirely when the tab/app is closed, the device restarts, or battery-saving restrictions apply. A service worker cannot independently wake itself up at a scheduled time. Reliable scheduled notifications while the app is closed require a server-backed push service (for example, a small backend plus Web Push and a scheduler) or native-app scheduling.

## Photo logging limitation

The photo is previewed locally. This version does **not** automatically recognize foods or estimate calories from pixels. Enter the meal name and nutrition estimate yourself, or use food search and confirm the portion. To add AI photo estimates, connect a vision API through a backend; do not put secret API keys in browser JavaScript. AI estimates must be reviewed by the user because portion sizes and recipes can be difficult to infer from images.

## Data and privacy

- Data is stored in this browser's `localStorage`.
- It does not sync between phone and computer automatically.
- Clearing browser site data can remove saved logs.
- Use **Export data** to save a JSON backup.
- Food database values are approximate; recipe and portion sizes vary.

## Customize targets

Open `app.js` and edit:
```js
calorieTarget: 2300,
proteinTarget: 100,
currentWeight: 55.5,
goalWeight: 70,
```

For a production app, consider user accounts, cloud sync, an authoritative nutrition database, stronger privacy controls, and server-scheduled web push.
