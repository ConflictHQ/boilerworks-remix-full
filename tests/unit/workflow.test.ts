import { describe, it, expect } from "vitest";

interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
}

// Pure workflow transition validation logic
function isValidTransition(
  transitions: WorkflowTransition[],
  currentState: string,
  targetState: string,
): boolean {
  return transitions.some((t) => t.from === currentState && t.to === targetState);
}

function getAvailable(transitions: WorkflowTransition[], currentState: string) {
  return transitions.filter((t) => t.from === currentState);
}

const transitions: WorkflowTransition[] = [
  { from: "draft", to: "pending_review", label: "Submit for Review" },
  { from: "pending_review", to: "approved", label: "Approve" },
  { from: "pending_review", to: "rejected", label: "Reject" },
  { from: "rejected", to: "draft", label: "Revise" },
];

describe("workflow transition validation", () => {
  it("allows valid transitions", () => {
    expect(isValidTransition(transitions, "draft", "pending_review")).toBe(true);
    expect(isValidTransition(transitions, "pending_review", "approved")).toBe(true);
    expect(isValidTransition(transitions, "pending_review", "rejected")).toBe(true);
    expect(isValidTransition(transitions, "rejected", "draft")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(isValidTransition(transitions, "draft", "approved")).toBe(false);
    expect(isValidTransition(transitions, "approved", "draft")).toBe(false);
    expect(isValidTransition(transitions, "rejected", "approved")).toBe(false);
    expect(isValidTransition(transitions, "draft", "rejected")).toBe(false);
  });

  it("rejects self-transitions", () => {
    expect(isValidTransition(transitions, "draft", "draft")).toBe(false);
    expect(isValidTransition(transitions, "approved", "approved")).toBe(false);
  });

  it("returns available transitions from draft", () => {
    const available = getAvailable(transitions, "draft");
    expect(available).toHaveLength(1);
    expect(available[0].to).toBe("pending_review");
  });

  it("returns available transitions from pending_review", () => {
    const available = getAvailable(transitions, "pending_review");
    expect(available).toHaveLength(2);
    expect(available.map((t) => t.to).sort()).toEqual(["approved", "rejected"]);
  });

  it("returns no transitions from approved (terminal state)", () => {
    const available = getAvailable(transitions, "approved");
    expect(available).toHaveLength(0);
  });

  it("returns available transitions from rejected back to draft", () => {
    const available = getAvailable(transitions, "rejected");
    expect(available).toHaveLength(1);
    expect(available[0].to).toBe("draft");
  });
});
