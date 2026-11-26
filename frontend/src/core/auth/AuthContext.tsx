import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, getAccessToken, setAccessToken } from '../api/httpClient';
import { localDb, type SessionSnapshot } from '../db/database';
import { syncEngine } from '../sync/syncEngine';
import type { Branch, Business, MePayload, SubscriptionStatus } from '../types';

interface AuthContextValue {
  loading: boolean;
  me: MePayload | null;
  isAccessBlocked: boolean;
  activeBusiness: Business | null;
  activeBranch: Branch | null;
  subscriptionRequired: boolean;
  setActiveBranch: (businessId: string, branchId: string) => void;
  refreshProfile: () => Promise<MePayload | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hydrateFromSnapshot(snap: SessionSnapshot): MePayload {
  const businesses: Business[] = JSON.parse(snap.businessesJson || '[]');
  return {
    user: {
      id: snap.userId,
      account_id: snap.accountId,
      full_name: snap.fullName,
      email: '',
      is_owner: snap.isOwner,
    },
    businesses,
    subscription: {
      status: snap.subscriptionStatus as SubscriptionStatus,
      trial_ends_at: snap.trialEndsAt,
      grace_until: snap.graceUntil,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MePayload | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  const persistSnapshot = async (profile: MePayload, bizId: string | null, branchId: string | null) => {
    await localDb.sessionSnapshot.put({
      id: 'current',
      userId: profile.user.id,
      accountId: profile.user.account_id,
      fullName: profile.user.full_name,
      isOwner: profile.user.is_owner,
      activeBusinessId: bizId,
      activeBranchId: branchId,
      businessesJson: JSON.stringify(profile.businesses),
      subscriptionStatus: profile.subscription?.status || 'none',
      trialEndsAt: profile.subscription?.trial_ends_at || null,
      graceUntil: profile.subscription?.grace_until || null,
      updatedAt: new Date().toISOString(),
    });
  };

  const refreshProfile = async (): Promise<MePayload | null> => {
    const res = await apiFetch<MePayload>('/me');
    const savedBizId = localStorage.getItem('bos_active_business_id');
    const savedBranchId = localStorage.getItem('bos_active_branch_id')
    if (res.ok && res.body.data) {
      const profile = res.body.data;
      setMe(profile);
      setSubscriptionRequired(false);

      const firstBiz = profile.businesses.at(0) || null;
      const firstBranch = firstBiz?.branches?.at(0) || null;
      const nextBizId = activeBusinessId || firstBiz?.id || null;
      const nextBranchId = activeBranchId || firstBranch?.id || null;

      setActiveBusinessId(savedBizId);
      setActiveBranchId(savedBranchId);
      
      await persistSnapshot(profile, nextBizId, nextBranchId);
      return profile;
    }

    return null;
  };

  useEffect(() => {
    syncEngine.init();
    const isPublicRoute = window.location.pathname.startsWith('/auth/');

    void (async () => {
      try {
        // 1. Hydrate immediately from IndexedDB so reload & offline boot are instant
        const snap = await localDb.sessionSnapshot.get('current');
        if (snap && getAccessToken()) {
          setMe(hydrateFromSnapshot(snap));
          setActiveBusinessId(snap.activeBusinessId);
          setActiveBranchId(snap.activeBranchId);
          setLoading(false);
        }

        // 2. Revalidate in background when online and authenticated
        if (!isPublicRoute && getAccessToken() && navigator.onLine) {
          await refreshProfile();
        }
      } finally {
        setLoading(false);
      }
    })();

    const onExpired = () => {
      setAccessToken(null);
      setMe(null);
      void localDb.sessionSnapshot.clear();
    };

    const onSubRequired = () => setSubscriptionRequired(true);

    window.addEventListener('bos:session-expired', onExpired);
    window.addEventListener('bos:subscription-required', onSubRequired);
    return () => {
      window.removeEventListener('bos:session-expired', onExpired);
      window.removeEventListener('bos:subscription-required', onSubRequired);
    };
  }, []);

  const setActiveBranch = (businessId: string, branchId: string) => {
    setActiveBusinessId(businessId);
    setActiveBranchId(branchId);
    if (me) {
      void persistSnapshot(me, businessId, branchId);
    }

    localStorage.setItem('bos_active_business_id', businessId);
    localStorage.setItem('bos_active_branch_id', branchId);

  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setMe(null);
    await localDb.sessionSnapshot.clear();
  };

  const activeBusiness = me?.businesses.find((b) => b.id === activeBusinessId) || me?.businesses.at(0) || null;
  const activeBranch = activeBusiness?.branches.find((br) => br.id === activeBranchId) || activeBusiness?.branches.at(0) || null;
  const isTrialExpired =
    me?.subscription?.status === 'trialing' &&
    Boolean(me.subscription.trial_ends_at) &&
    new Date(me.subscription.trial_ends_at!.endsWith('Z') ? me.subscription.trial_ends_at! : `${me.subscription.trial_ends_at!.replace(' ', 'T')}Z`).getTime() <= Date.now();

  const isStatusBlocked = me?.subscription?.status === 'past_due' || me?.subscription?.status === 'cancelled' || me?.subscription?.status === 'pending_payment';
  const isAccessBlocked = Boolean(me && me.businesses.length > 0 && (subscriptionRequired || isTrialExpired || isStatusBlocked));


  return (
    <AuthContext.Provider
      value={{ loading, me, isAccessBlocked, activeBusiness, activeBranch, subscriptionRequired, setActiveBranch, refreshProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
