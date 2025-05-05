import { describe, it, expect } from "vitest";
import { render, hasUnreplaced } from "../placeholder";

describe("placeholder", () => {
  describe("render", () => {
    it("should replace simple placeholders", () => {
      const md = "Hello $name, welcome to $place!";
      const map = { name: "World", place: "Test" };
      expect(render(md, map)).toBe("Hello World, welcome to Test!");
    });

    it("should handle numeric values", () => {
      const md = "The value is $count";
      const map = { count: 123 };
      expect(render(md, map)).toBe("The value is 123");
    });

    it("should leave unmapped placeholders untouched", () => {
      const md = "Hello $name, your ID is $id";
      const map = { name: "User" };
      expect(render(md, map)).toBe("Hello User, your ID is $id");
    });

    it("should handle placeholders with numbers and underscores", () => {
      const md = "Value 1: $val_1, Value 2: $val2";
      const map = { val_1: "A", val2: "B" };
      expect(render(md, map)).toBe("Value 1: A, Value 2: B");
    });

    it("should handle multiple occurrences of the same placeholder", () => {
      const md = "Test $key: $key";
      const map = { key: "Value" };
      expect(render(md, map)).toBe("Test Value: Value");
    });

    it("should return the original string if no placeholders are present", () => {
      const md = "Just plain text.";
      const map = { key: "Value" };
      expect(render(md, map)).toBe("Just plain text.");
    });

    it("should return the original string if the map is empty", () => {
      const md = "Hello $name";
      const map = {};
      expect(render(md, map)).toBe("Hello $name");
    });

    it("should correctly replace adjacent placeholders", () => {
      const md = "$greeting$punctuation";
      const map = { greeting: "Hello", punctuation: "!" };
      expect(render(md, map)).toBe("Hello!");
    });

    it("should not replace parts of words or invalid placeholders", () => {
      const md = "This has a $valid placeholder, but also money$$. Not $1invalid";
      const map = { valid: "good" };
      expect(render(md, map)).toBe("This has a good placeholder, but also money$$. Not $1invalid");
    });
  });

  describe("hasUnreplaced", () => {
    it("should return true if unreplaced placeholders exist", () => {
      expect(hasUnreplaced("Hello $name")).toBe(true);
      expect(hasUnreplaced("Value: $val_1")).toBe(true);
    });

    it("should return false if no unreplaced placeholders exist", () => {
      expect(hasUnreplaced("Hello World")).toBe(false);
      expect(hasUnreplaced("Just text")).toBe(false);
    });

    it("should return false for strings with replaced placeholders", () => {
      const md = "Hello $name";
      const map = { name: "World" };
      const rendered = render(md, map);
      expect(hasUnreplaced(rendered)).toBe(false);
    });

    it("should return false for invalid placeholder formats", () => {
      expect(hasUnreplaced("money$$")).toBe(false);
      expect(hasUnreplaced("$1invalid")).toBe(false); // Placeholders must start with a letter
      expect(hasUnreplaced("no space$ here")).toBe(false);
    });
  });
});
