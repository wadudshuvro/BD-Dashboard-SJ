export function buildAgentChatUrl(baseUrl: string | null | undefined, agentId: string): string | null {
  if (!agentId) {
    return null;
  }

  const trimmedBaseUrl = baseUrl?.trim();

  if (!trimmedBaseUrl) {
    return null;
  }

  const sanitizedBaseUrl = trimmedBaseUrl.replace(/\/$/, "");
  return `${sanitizedBaseUrl}/agents/${agentId}`;
}
