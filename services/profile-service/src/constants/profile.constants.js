/**
 * Minimum `profileCompletion` score at which a profile counts as "onboarded"
 * and auth-service's `profileCompleted` flag is flipped to true.
 *
 * Both `calculateCompletion()` implementations score a fully filled onboarding
 * form at 83% (customer, 5/6 fields) and 86% (provider, 6/7 fields) — the only
 * remaining field is the optional profile image. 60 clears that bar while still
 * rejecting a half-filled form.
 */
const PROFILE_COMPLETE_THRESHOLD = 60;

module.exports = {
  PROFILE_COMPLETE_THRESHOLD,
};
