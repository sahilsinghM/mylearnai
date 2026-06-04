/**
 * Pure session-end logic — no side effects, no React imports.
 *
 * @param recentAnswers  Correctness of chip-answer responses only (typed free-text not included).
 *                       The first choice in the API response is always correct by system-prompt
 *                       convention; the client marks it before shuffling display order.
 * @param questionCount  Number of assistant questions asked so far.
 */
export function shouldEndSession(recentAnswers: boolean[], questionCount: number): boolean {
  // Absolute hard stop
  if (questionCount >= 15) return true;

  // Unconditional cap
  if (questionCount >= 12) return true;

  // Mastery exit: sustained correct chip answers
  if (questionCount >= 8 && recentAnswers.length >= 3) {
    const last3 = recentAnswers.slice(-3);
    if (last3.every(Boolean)) return true;
  }

  return false;
}
