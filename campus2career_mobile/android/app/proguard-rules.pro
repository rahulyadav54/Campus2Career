# Campus2Career — keep Flutter / plugin entry points if minify is ever enabled
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Speech / TTS
-keep class com.csdcorp.speech_to_text.** { *; }
-keep class com.tundralabs.fluttertts.** { *; }

# Dio / OkHttp (if minify enabled later)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
