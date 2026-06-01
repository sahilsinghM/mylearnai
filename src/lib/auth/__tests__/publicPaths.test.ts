import { describe, expect, it } from "vitest";
import { isPublicPath } from "../publicPaths";

describe("isPublicPath", () => {
  it("allows visitors to browse the Master Roadmap and node SEO pages", () => {
    expect(isPublicPath("/roadmap")).toBe(true);
    expect(isPublicPath("/roadmap/self-attention")).toBe(true);
  });
});
