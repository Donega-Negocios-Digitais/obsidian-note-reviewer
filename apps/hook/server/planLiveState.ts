export interface PlanLiveRevision {
  revisionId: string;
  content: string;
  filePath: string;
  createdAt: string;
  sessionId: string;
}

export type PlanLiveDecisionType = "approve" | "request_changes";

export interface PlanLiveDecision {
  revisionId: string;
  decision: PlanLiveDecisionType;
  feedback: string;
  createdAt: string;
}

export class PlanLiveState {
  private currentRevision: PlanLiveRevision | null = null;
  private decisions = new Map<string, PlanLiveDecision>();

  setRevision(revision: PlanLiveRevision): PlanLiveRevision {
    this.currentRevision = revision;
    return revision;
  }

  getRevision(): PlanLiveRevision | null {
    return this.currentRevision;
  }

  setDecision(input: {
    revisionId: string;
    decision: PlanLiveDecisionType;
    feedback?: string;
  }): PlanLiveDecision {
    const nextDecision: PlanLiveDecision = {
      revisionId: input.revisionId,
      decision: input.decision,
      feedback: input.feedback?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    this.decisions.set(input.revisionId, nextDecision);
    return nextDecision;
  }

  getDecision(revisionId: string): PlanLiveDecision | null {
    return this.decisions.get(revisionId) || null;
  }

  async waitForDecision(
    revisionId: string,
    timeoutMs: number
  ): Promise<PlanLiveDecision | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const decision = this.getDecision(revisionId);
      if (decision) {
        return decision;
      }
      await Bun.sleep(250);
    }
    return null;
  }
}
