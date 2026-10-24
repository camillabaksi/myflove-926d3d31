// Release settings are read directly so an accidental native version/identity drift fails.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const android = readFileSync("android/app/build.gradle", "utf8");
const ios = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
const capacitor = readFileSync("capacitor.config.ts", "utf8");

describe("approved native release settings", () => {
  it("sets Android version 6.8 and increments code 28 to 29", () => {
    expect(android.match(/versionName\s+"([^"]+)"/)?.[1]).toBe("6.8");
    expect(Number(android.match(/versionCode\s+(\d+)/)?.[1])).toBe(29);
  });

  it("sets both iOS configurations to version 1.6 and build 19", () => {
    expect(Array.from(ios.matchAll(/MARKETING_VERSION = ([^;]+);/g), match => match[1])).toEqual(["1.6", "1.6"]);
    expect(Array.from(ios.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g), match => Number(match[1]))).toEqual([19, 19]);
  });

  it("preserves the existing separate Android and iOS store identities", () => {
    expect(android.match(/applicationId\s+"([^"]+)"/)?.[1]).toBe("app.myflove.mobile");
    expect(android.match(/namespace\s*=\s*"([^"]+)"/)?.[1]).toBe("app.myflove.mobile");
    expect(Array.from(ios.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g), match => match[1])).toEqual(["se.myflove.app", "se.myflove.app"]);
  });

  it("preserves the current web origin and native brand configuration", () => {
    expect(capacitor.match(/url:\s*"([^"]+)"/)?.[1]).toBe("https://www.paceable.se");
    expect(capacitor.match(/appId:\s*"([^"]+)"/)?.[1]).toBe("se.myflove.app");
    expect(capacitor.match(/appName:\s*"([^"]+)"/)?.[1]).toBe("Paceable");
  });
});
