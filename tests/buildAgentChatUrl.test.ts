import { describe, expect, test } from "bun:test";
import { buildAgentChatUrl } from "../src/features/collabai/buildAgentChatUrl";

describe("buildAgentChatUrl", () => {
  test("returns sanitized url when base url and agent id provided", () => {
    expect(buildAgentChatUrl("http://localhost:9999/", "agent-123")).toBe(
      "http://localhost:9999/agents/agent-123",
    );
  });

  test("returns null when base url missing", () => {
    expect(buildAgentChatUrl(" ", "agent-123")).toBeNull();
  });

  test("returns null when agent id missing", () => {
    // @ts-expect-error intentional empty id for runtime guard
    expect(buildAgentChatUrl("http://localhost:9999", "")).toBeNull();
  });
});
