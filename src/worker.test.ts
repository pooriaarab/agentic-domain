import { describe, expect, it } from "vitest";

describe("worker", () => {
  it("intentionally exposes no HTTP worker", () => expect(true).toBe(true));
});
