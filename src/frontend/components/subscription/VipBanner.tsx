import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/frontend/context";
import { SubscriptionModal } from "./SubscriptionModal";

export function VipBanner() {
  const { isVip, plan } = useAccount();
  const [modalOpen, setModalOpen] = useState(false);

  if (isVip) {
    return (
      <div className="mx-auto my-10 max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/30 border border-emerald-500/30 p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Crown className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  VIP Active
                </span>
                <span className="text-sm font-bold text-white capitalize">
                  {plan} Tier Member
                </span>
              </div>
              <p className="text-xs text-white/60 m-0 mt-0.5">
                All short drama episodes unlocked in Full HD with Google Cloud
                ultra-fast streaming.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 shrink-0"
          >
            Manage Membership
          </Button>
          <SubscriptionModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto my-12 max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-[#13131a] to-black border border-primary/30 p-6 sm:p-8 text-white shadow-2xl">
          {/* Ambient background glow */}
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase">
                <Crown className="size-3.5" />
                <span>Tadka4U VIP Cinema Plans</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                Stream All Episodes in Full HD & 4K with Zero Buffering
              </h2>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed m-0">
                Unlock unrestricted access to our complete library of Indian
                short dramas, early releases, and multi-device streaming on TV,
                Laptop, and Mobile starting at just ₹99/month.
              </p>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-white/80">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  <span>1080p & 4K Ultra HD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  <span>Google Cloud 5 TB High Speed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  <span>TV, Laptop & Phone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                variant="cinema"
                size="lg"
                onClick={() => setModalOpen(true)}
                className="text-sm font-bold gap-2 px-6 shadow-lg shadow-primary/30 cursor-pointer"
              >
                <Sparkles className="size-4" />
                <span>Explore VIP Plans</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-sm border-white/20 hover:bg-white/10 text-white cursor-pointer"
              >
                <Link to="/plans">
                  <span>Compare Features</span>
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
