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
}

export const AccountContext = createContext<AccountContextType>({
  user: null,
  saved: [],
  toggle: () => {},
  isLoaded: false,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [saved, setSaved] = useState<string[]>([]);

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
      setSaved([]);
      return;
    }
    watchlistApi.getUserWatchlist(user.id).then(({ showIds, error }) => {
      if (active) {
        setSaved(showIds);
        if (error) toast.error("Your list could not load. Please try again.");
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = async (id: string) => {
    if (!user) {
      toast("Sign in to save your favorites", {
        action: {
          label: "Sign in",
          onClick: () => {
            window.location.href = "/sign-in";
          },
        },
      });
      return;
    }
    const exists = saved.includes(id);
    const { added, error } = await watchlistApi.toggleWatchlist(
      user.id,
      id,
      exists,
    );
    if (error) {
      toast.error("Could not update your list. Please try again.");
      return;
    }
    setSaved((old) => (added ? [...old, id] : old.filter((s) => s !== id)));
    toast.success(added ? "Added to My List" : "Removed from My List");
  };

  return (
    <AccountContext.Provider value={{ user, saved, toggle, isLoaded }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
