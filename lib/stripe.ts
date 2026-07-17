import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  : null;

export const PLANS = {
  premium: {
    monthly: process.env.STRIPE_PRICE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_YEARLY!,
    prices: { monthly: 19, yearly: 149 },
  },
} as const;
