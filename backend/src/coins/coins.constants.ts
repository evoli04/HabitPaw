/**
 * Coins granted for completing one habit — once per habit per day.
 *
 * The mobile app has the same number in `mobile/src/contexts/CoinContext.js`
 * (`HABIT_REWARD`). This copy is the authoritative one and is echoed back in
 * `GET /coins` so the client can stop hardcoding it.
 */
export const HABIT_REWARD = 30;

/** How many ledger rows `GET /coins` returns. */
export const RECENT_TRANSACTION_LIMIT = 20;
