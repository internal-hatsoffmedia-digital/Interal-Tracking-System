# Hatsoff mobile

React Native / Expo app for the same Supabase workspace as the web application. The development source also remains in the sibling `hatsoff-mobile` folder; this directory is the GitHub copy as of 3 October 2026.

## Run and check

Install with `npm ci`, copy `.env.example` to `.env` and configure the public Supabase URL and anonymous key. Never include a service-role key in a mobile app.

Run `npm start`, `npm run typecheck`, `npm test`, or `npm run bundle`. Android native builds require the Android SDK and JDK; iOS native builds require macOS and Xcode.

## Current validation and release limits

The mobile tests pass (11 tests), TypeScript compilation passes, and fresh Android and iOS Hermes JavaScript exports pass. Real Lavanya login, profile loading, session restoration and an empty My Work response were checked in Expo web. This is not native-device end-to-end certification.

Workspace entry requires an active supported profile. Management actions use verified roles, project creation carries team identity, task creation validates its project, and timesheets require a linked employee. My Work supports accepting assignments; Team Work supports manager assignment. The Associate Lead dashboard includes coordinator activity scoped to the lead's team.

Production is not ready. The latest live profiles have coordinator roles for Lavanya and Esther and Associate Lead for Muskan, but their team IDs are empty. The requested oversight and assignment workflow still needs correct team membership and authenticated permission tests. Employee start/completion and parent-task review transitions still need a complete verified workflow.

The local Android APK build failed during Gradle dependency-accessor cache processing. No APK or signed release was produced and no Android device was connected. Android/iOS JavaScript bundle exports are separate from native builds. iOS native testing is pending.

Release signing uses `HATSOFF_UPLOAD_STORE_FILE`, `HATSOFF_UPLOAD_STORE_PASSWORD`, `HATSOFF_UPLOAD_KEY_ALIAS`, and `HATSOFF_UPLOAD_KEY_PASSWORD`. Supply these securely outside Git. Confirm the Android application ID, configure an iOS bundle identifier, and configure store/EAS credentials before publishing. The included Android debug keystore is only for development.

The web application's latest checks passed 80 tests, TypeScript and the Vite build, but ESLint still reports 56 errors and one warning. See the web testing report for further limitations.
