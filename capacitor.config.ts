import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config för MyFlove native app (iOS + Android).
 *
 * `server.url` pekar mot den publicerade webbappen så att den native-skalade
 * appen alltid kör den senaste versionen utan att du behöver bygga om iOS/Android
 * projektet vid varje ändring. När du vill bundla webben lokalt istället:
 * kommentera bort `server.url`, sätt `webDir` till en byggd statisk mapp och
 * kör `bunx cap sync`.
 */
const config: CapacitorConfig = {
  appId: "app.myflove.mobile",
  appName: "MyFlove",
  webDir: "mobile-webroot",
  server: {
    url: "https://myflove.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#F5EFE6",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F5EFE6",
    },
  },
};

export default config;
