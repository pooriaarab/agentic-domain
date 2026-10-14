import { describe, expect, it } from "vitest";
import * as api from "./index.js";

describe("public API", () => {
  it("exports domain workflow primitives", () => {
    expect(api.runDomain).toBeTypeOf("function");
    expect(api.checkDomain).toBeTypeOf("function");
    expect(api.buyDomain).toBeTypeOf("function");
    expect(api.CloudflareRegistrar).toBeTypeOf("function");
  });
});
