# betHouse

Football betting app demo. Expo SDK 58, React Native 0.88, Reanimated 4.
Glassmorphism shell, skeuomorphic tear-off bet slip. Mock data and a simulated odds feed: no real money, no backend.

## Run
```
npm install
npx expo start            # Expo Go, if it supports SDK 58
npx expo run:ios          # or run:android: development build (recommended)
```
Before building for stores, change `ios.bundleIdentifier` and `android.package` in app.json.

## Structure
- App.tsx: app state, fonts, layout, splash handoff
- src/theme.ts, src/data.ts, src/hooks.ts: tokens, mock matches, odds feed
- src/components: Backdrop (pitch at night), Splash (animated launch), Glass, OddsButton, LiveCard, MatchRow, TabBar, SlipBar, TicketSheet
- src/screens: Home, MyBets, Wallet

`npm run typecheck` runs tsc.
