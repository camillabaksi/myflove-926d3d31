import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fromRepo = (path: string) => readFileSync(path, "utf8");

describe("Paceable signed native release source preflight", () => {
  const android = fromRepo("android/app/build.gradle");
  const ios = fromRepo("ios/App/App.xcodeproj/project.pbxproj");
  const capacitor = fromRepo("capacitor.config.ts");
  const codemagic = fromRepo("codemagic.yaml");
  const androidStrings = fromRepo("android/app/src/main/res/values/strings.xml");
  const releaseInstructions = fromRepo("MOBILE_BUILD.md");

  it("retains both previously published store identities and the Paceable display name", () => {
    expect(android).toContain('applicationId "app.myflove.mobile"');
    expect(android).toContain('namespace = "app.myflove.mobile"');
    expect(ios.match(/PRODUCT_BUNDLE_IDENTIFIER = se\.myflove\.app;/g)).toHaveLength(2);
    expect(capacitor).toContain('appId: "se.myflove.app"');
    expect(capacitor).toContain('appName: "Paceable"');
    expect(androidStrings).toContain('<string name="app_name">Paceable</string>');
    expect(fromRepo("ios/App/App/Info.plist")).toContain("<string>Paceable</string>");
  });

  it("keeps two Xcode configurations at the same monotonically increased version/build", () => {
    expect(ios.match(/MARKETING_VERSION = 1\.6;/g)).toHaveLength(2);
    expect(ios.match(/CURRENT_PROJECT_VERSION = 18;/g)).toHaveLength(2);
    expect(android).toMatch(/versionName "6\.8"/);
    expect(android).toMatch(/versionCode 29/);
    expect(releaseInstructions).toContain("| Android | 6.8 | versionCode 29 | app.myflove.mobile |");
    expect(releaseInstructions).toContain("| iOS | 1.6 | CURRENT_PROJECT_VERSION 18 | se.myflove.app |");
  });

  it("loads the existing public host and only existing signed Codemagic workflows", () => {
    expect(capacitor).toContain('url: "https://www.paceable.se"');
    expect(codemagic).toContain("  android-release:");
    expect(codemagic).toContain("  ios-release:");
    expect(codemagic).toContain("paceable_android_signing");
    expect(codemagic).toContain("MYFLOVE_KEYSTORE_BASE64");
    expect(codemagic).toContain("testReleaseUnitTest bundleRelease");
    expect(codemagic).toContain("app_store_connect: MyFlove ASC");
    expect(codemagic).toContain("submit_to_testflight: true");
    expect(codemagic).not.toMatch(/(storePassword|keyPassword):\s*[^\s$]/);
  });
});
