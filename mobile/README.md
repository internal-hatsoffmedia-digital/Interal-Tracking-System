# Hatsoff mobile

React Native / Expo app for the same Supabase workspace as the web application. The development source also remains in the sibling `hatsoff-mobile` folder; this directory is the GitHub copy as of 3 October 2026.

## Run and check

Install with `npm ci`, copy `.env.example` to `.env` and configure the public Supabase URL and anonymous key. Never include a service-role key in a mobile app.

Run `npm start`, `npm run typecheck`, `npm test`, or `npm run bundle`. Android native builds require the Android SDK and JDK; iOS native builds require macOS and Xcode.

## Current validation and release limits

The mobile tests pass (15 tests), TypeScript compilation passes, and fresh Android and iOS Hermes JavaScript exports pass. Real Lavanya login, profile loading, session restoration and an empty My Work response were checked in Expo web. This is not native-device end-to-end certification.

Workspace entry requires an active supported profile. Management actions use verified roles, project creation carries team identity, task creation validates its project, and timesheets require a linked employee. My Work supports accepting assignments; Team Work supports manager assignment. The Associate Lead dashboard includes coordinator activity scoped to the lead's team.

Production is not ready. The latest live profiles have coordinator roles for Lavanya and Esther and Associate Lead for Muskan, but their team IDs are empty. The requested oversight and assignment workflow still needs correct team membership and authenticated permission tests. Employee start/completion and parent-task review transitions still need a complete verified workflow.

The earlier Android build failed during Gradle dependency-accessor cache processing. The latest debug build succeeds. No production-signed release or device validation has been completed. Android/iOS JavaScript bundle exports are separate from native builds. iOS native testing is pending.

Release signing uses `HATSOFF_UPLOAD_STORE_FILE`, `HATSOFF_UPLOAD_STORE_PASSWORD`, `HATSOFF_UPLOAD_KEY_ALIAS`, and `HATSOFF_UPLOAD_KEY_PASSWORD`. Supply these securely outside Git. Confirm the Android application ID, configure an iOS bundle identifier, and configure store/EAS credentials before publishing. The included Android debug keystore is only for development.

The web application's latest checks passed 80 tests, TypeScript and the Vite build, but ESLint still reports 56 errors and one warning. See the web testing report for further limitations.

## Native conversion update

Added native Reports, Planner, My Team, Team Members and editable profile settings. Navigation includes scrollable shortcuts, bottom tabs and a More menu. Assignments show assigner names and IST timestamps; the original logo is bundled locally. Latest checks: 15 passing tests, TypeScript passes, Android/iOS JavaScript exports pass. Login, dashboard and populated reports were verified in Expo web. See `../MOBILE-CONVERSION.md` in the GitHub checkout for remaining website parity and device-testing gaps.

For a debug Android build on this workstation, set `ANDROID_HOME` to the existing SDK directory and run `android/gradlew.bat :app:assembleDebug`. Debug builds need Metro; they are not standalone store releases. Never commit local SDK paths, generated caches or signing secrets.

Standalone Android preview: test-artifacts/hatsoff-mobile-preview.apk. Latest preview Gradle build and APK signature verification pass. Bundled JavaScript is included. This development-signed internal preview targets arm64-v8a and uses a separate .preview application ID. Physical-device testing and production release signing are pending.
