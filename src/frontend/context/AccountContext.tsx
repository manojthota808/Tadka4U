import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/react";
import { watchlistApi } from "@/api";
import { toast } from "sonner";
import {
  getStoredSubscription,
  saveStoredSubscription,
  SUBSCRIPTION_PLANS,
} from "@/lib/subscription-plans";

export interface AccountUser {
  id: string;
  email?: string | undefined;
  fullName?: string | null | undefined;
  imageUrl?: string | undefined;
}

export interface AccountContextType {
  user: AccountUser | null;
  saved: string[];
  toggle: (id: string) => void;
  isLoaded: boolean;
  plan: "mobile" | "super" | "premium" | null;
  billingCycle: "monthly" | "annual";
  isVip: boolean;
  subscribeToPlan: (
    planId: "mobile" | "super" | "premium",
    billing?: "monthly" | "annual",
  ) => void;
  cancelSubscription: () => void;
}

export const AccountContext = createContext<AccountContextType>({
  user: null,
  saved: [],
  toggle: () => {},
  isLoaded: false,
  plan: null,
  billingCycle: "monthly",
  isVip: false,
  subscribeToPlan: () => {},
  cancelSubscription: () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [saved, setSaved] = useState<string[]>([]);
  const [subscription, setSubscription] = useState(() =>
    getStoredSubscription(),
  );

  const user = useMemo<AccountUser | null>(() => {
    if (!isSignedIn || !clerkUser) return null;
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      fullName: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    };
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    let active = true;
    if (!user) {
      watchlistApi.getUserWatchlist("guest").then(({ showIds }) => {
        if (active) {
          setSaved(showIds);
        }
      });
      return;
    }

    // Migrate any shows saved while visiting as a guest into the user's account
    watchlistApi.migrateWatchlist("guest", user.id).then(() => {
      if (!active) return;
      watchlistApi.getUserWatchlist(user.id).then(({ showIds, error }) => {
        if (active) {
          setSaved(showIds);
          if (error) {
            console.warn("[Watchlist] Failed to load list:", error.message);
          }
        }
      });
    });

    return () => {
      active = false;
    };
  }, [user]);

  const toggle = async (id: string) => {
    const targetUserId = user ? user.id : "guest";
    const exists = saved.includes(id);

    const { added, error } = await watchlistApi.toggleWatchlist(
      targetUserId,
      id,
      exists,
    );

    if (error) {
      toast.error("Could not update your list. Please try again.");
      return;
    }

    setSaved((old) => (added ? [...old, id] : old.filter((s) => s !== id)));

    if (!user) {
      toast.success(added ? "Added to My List" : "Removed from My List", {
        description: "Sign in to keep your list synced across devices.",
        action: {
          label: "Sign in",
          onClick: () => {
            window.location.href = "/sign-in";
          },
        },
      });
    } else {
      toast.success(added ? "Added to My List" : "Removed from My List");
    }
  };

  const subscribeToPlan = (
    planId: "mobile" | "super" | "premium",
    billing: "monthly" | "annual" = "monthly",
  ) => {
    saveStoredSubscription(planId, billing);
    setSubscription({
      planId,
      subscribedAt: new Date().toISOString(),
      billing,
    });
    const foundPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    toast.success(`🎉 Subscribed to ${foundPlan?.name || "VIP Plan"}!`, {
      description: "All episodes and premium features unlocked.",
    });
  };

  const cancelSubscription = () => {
    saveStoredSubscription(null);
    setSubscription({ planId: null, subscribedAt: null, billing: "monthly" });
    toast.info("Subscription cancelled. You are currently on the Free tier.");
  };

  return (
    <AccountContext.Provider
      value={{
        user,
        saved,
        toggle,
        isLoaded,
        plan: subscription.planId,
        billingCycle: subscription.billing,
        isVip: Boolean(subscription.planId),
        subscribeToPlan,
        cancelSubscription,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
