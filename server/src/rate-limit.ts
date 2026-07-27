import rateLimit from 'express-rate-limit';

// Admin login had no throttling at all - a constant-time password compare
// (see admin-auth.ts) protects against timing attacks, but does nothing to
// stop plain brute force. This caps guesses per IP; a real admin mistyping
// their password a few times in a row is unaffected.
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

// Every request here calls a paid AI provider (Gemini/Groq) or a paid
// transcription API, and neither route requires auth for guests - without
// a limit, an anonymous caller could run up the provider bill or exhaust
// quota just by looping requests.
export const aiUsageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
