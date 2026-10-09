# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# SDK 54 is pinned on purpose — do not upgrade it

This project is deliberately held at Expo SDK 54. It is not stale, and it is not
waiting to be helpfully bumped.

Reason: the Expo Go builds on the App Store and Play Store are stuck at SDK 54.
Expo Go for SDK 55 and later is still in Apple review and is not distributed
through the stores. Reaching SDK 55+ on a physical iPhone requires `eas go` or an
EAS development build, and both need a paid Apple Developer Program membership
that this team does not have. SDK 54 is currently the only version that runs on a
physical iPhone for free.

Do not raise `expo`, `react-native`, `react`, or any `expo-*` version without
asking the project owner first. That includes "fixing" a version that looks
outdated, and running `npx expo install --fix` after bumping `expo` yourself.

The full rationale, sources, and the conditions under which this decision gets
reopened live in `SDK-KARARI.md` at the repo root (gitignored, local only).
