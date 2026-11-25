/* Who the invitation is addressed to. The key travels in the link as ?a=<key>. */
export const AUDIENCES = {
  you: { label: "ඔබට (එක් අයෙකුට)", phrase: "ඔබට" },
  couple: { label: "ඔබ දෙපළට", phrase: "ඔබ දෙපළට" },
  family: { label: "ඔබ ඇතුළු පවුලේ සැමට", phrase: "ඔබ ඇතුළු පවුලේ සැමට" },
} as const;

export type AudienceKey = keyof typeof AUDIENCES;

export const AUDIENCE_KEYS = Object.keys(AUDIENCES) as AudienceKey[];

export function readAudience(): AudienceKey {
  const value = new URLSearchParams(window.location.search).get("a");
  return value && value in AUDIENCES ? (value as AudienceKey) : "you";
}
