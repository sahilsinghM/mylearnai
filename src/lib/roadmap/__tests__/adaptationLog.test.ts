import { describe, expect, it } from "vitest";
import { buildAdaptationLogAction } from "../adaptationLog";

describe("buildAdaptationLogAction", () => {
  it("accepts an INSERT by making its prerequisite available", () => {
    expect(buildAdaptationLogAction("accepted", {
      decisionType: "INSERT",
      affectedNodeId: "linear-algebra",
    })).toEqual({
      logStatus: "accepted",
      nodeStateUpdate: {
        nodeId: "linear-algebra",
        state: "available",
      },
    });
  });

  it("dismisses an INSERT without changing Node State", () => {
    expect(buildAdaptationLogAction("overridden", {
      decisionType: "INSERT",
      affectedNodeId: "linear-algebra",
    })).toEqual({
      logStatus: "overridden",
      nodeStateUpdate: null,
    });
  });
});
