export function generateReferralCode(userId: string): string {
  const base = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FD${base}`;
}

export function buildReferralLink(code: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/cadastro?ref=${code}`;
}

export const REFERRAL_REWARD_BRL = 19;
