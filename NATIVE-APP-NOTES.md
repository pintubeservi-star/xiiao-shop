# Cotuí Go native app build

Android APKs are built by GitHub Actions using Capacitor 8.

## Current build mode
The Capacitor shell loads the branch preview URL so the existing Next.js server-rendered application and Supabase workflows remain available without a rewrite. This is a connected-app prototype: it requires internet access and the preview deployment must remain available.

This is not yet a self-contained/offline web bundle and is not the final Play Store release configuration. Before public release, replace the hosted runtime with a production domain, review allowed navigation, configure push notifications and app signing, and test GPS, keyboard, lifecycle, and trip tracking on real devices.

## Build
Open GitHub Actions, select Build Cotuí Go Android APK, and download artifact cotui-go-android-apk.
The current workflow creates an installable debug APK for testing. A signed release APK/AAB requires a protected Android signing keystore.
