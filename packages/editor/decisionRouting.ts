export interface DecisionRoutingArgs {
  isApiMode: boolean;
  isAnnotateMode: boolean;
  isPlanLiveMode: boolean;
  revisionId: string | null;
}

export interface PlanLiveApproveNoticeArgs {
  isRemoteHookReview: boolean;
  response: {
    savedToApp?: boolean;
  } | null;
}

export function shouldTrySessionDecision(args: DecisionRoutingArgs): boolean {
  if (!args.isApiMode || args.isAnnotateMode) {
    return false;
  }
  if (args.isPlanLiveMode) {
    return true;
  }
  return typeof args.revisionId === "string" && args.revisionId.trim().length > 0;
}

export function canFallbackToLegacyDecision(status: number | null): boolean {
  return status === 404 || status === 405;
}

export function resolvePlanLiveApproveNotice(
  args: PlanLiveApproveNoticeArgs
): string {
  if (args.isRemoteHookReview && args.response?.savedToApp === true) {
    return "Aprovação enviada e nota salva em Meus Documentos.";
  }
  return "Aprovação enviada para o Claude.";
}
