/**
 * Pro Access Hook - Check user's Pro/Enterprise access
 */

import { useAuth } from '../../../../contexts/AuthContext';

export function useProAccess() {
  const { user } = useAuth();

  // subscription_tier is a string from API (e.g., "pro", "free", "enterprise")
  const userTierName = (user as any)?.subscription_tier || 'free';
  const hasProAccess = userTierName === 'pro' || userTierName === 'enterprise';

  return {
    hasProAccess,
    userTierName,
  };
}
