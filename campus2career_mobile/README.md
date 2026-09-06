# Campus2Career Android (native API client)

Flutter Android app that talks to the Campus2Career **REST API**. It does not load the Vercel website.

Requires **Flutter 3.24+ / Dart 3.5+** (stable). The Dart constraint is `>=3.5.0 <4.0.0`.

## Run

```bash
cd campus2career_mobile
flutter pub get
flutter run
```

Production API: `https://campus2career-cpe2.onrender.com`  
Local emulator API: `http://10.0.2.2:5000`

## Check live student APIs

```bash
dart run tool/verify_live_api.dart
```

Optional env: `C2C_EMAIL`, `C2C_PASSWORD` (defaults try the demo student).
