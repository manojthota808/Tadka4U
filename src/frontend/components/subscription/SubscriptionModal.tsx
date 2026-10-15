import { useState } from "react";
import {
  X,
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/frontend/context";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlanId?: "mobile" | "super" | "premium";
}

export function SubscriptionModal({
  isOpen,
  onClose,
  defaultPlanId = "super",
}: SubscriptionModalProps) {
  const {
    plan: activePlan,
    subscribeToPlan,
    cancelSubscription,
  } = useAccount();
  const [selectedPlanId, setSelectedPlanId] = useState<
    "mobile" | "super" | "premium"
  >(defaultPlanId);
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking"
  >("upi");
  const [upiId, setUpiId] = useState("user@okhdfcbank");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentPlanObj =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) ||
    SUBSCRIPTION_PLANS[1]!;

  const handleSubscribe = () => {
    setIsProcessing(true);
    setTimeout(() => {
      subscribeToPlan(selectedPlanId, billing);
      setIsProcessing(false);
      onClose();
    }, 900);
  };

  const priceText =
    currency === "INR"
      ? billing === "annual"
        ? `₹${currentPlanObj.annualPrice}/mo (billed ₹${currentPlanObj.annualTotal}/yr)`
        : `₹${currentPlanObj.monthlyPrice}/mo`
      : billing === "annual"
        ? `$${currentPlanObj.usdAnnualPrice}/mo (billed $${(currentPlanObj.usdAnnualPrice * 12).toFixed(2)}/yr)`
        : `$${currentPlanObj.usdMonthlyPrice}/mo`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#111116] border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-primary/15 via-background to-background">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Crown className="size-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight m-0 text-white flex items-center gap-2">
                Unlock Tadka4U VIP Cinema
              </h3>
              <p className="text-xs text-white/60 m-0">
                Cancel or switch plans anytime. Zero lock-in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Close subscription dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Toggles: Billing & Currency */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Monthly / Annual Toggle */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  billing === "monthly"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billing === "annual"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SAVE 30%
                </span>
              </button>
            </div>

            {/* Currency selector */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  currency === "INR"
                    ? "border-primary bg-primary/20 text-white font-bold"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  currency === "USD"
                    ? "border-primary bg-primary/20 text-white font-bold"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          {/* Plan Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SUBSCRIPTION_PLANS.map((p) => {
              const isSelected = selectedPlanId === p.id;
              const isCurrent = activePlan === p.id;
              const displayPrice =
                currency === "INR"
                  ? billing === "annual"
                    ? `₹${p.annualPrice}`
                    : `₹${p.monthlyPrice}`
                  : billing === "annual"
                    ? `$${p.usdAnnualPrice}`
                    : `$${p.usdMonthlyPrice}`;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/40"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 left-4 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-primary text-white shadow-sm uppercase">
                      {p.badge}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white m-0">
                        {p.name}
                      </h4>
                      {isSelected && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-white/50 mb-2">
                      {p.resolution}
                    </div>
                    <div className="text-lg font-black text-white">
                      {displayPrice}
                      <span className="text-xs font-normal text-white/60">
                        /mo
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-white/70 space-y-1">
                    <div>{p.concurrentScreens} Screens at once</div>
                    <div>{p.audioQuality}</div>
                  </div>

                  {isCurrent && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-400 text-center uppercase tracking-wider bg-emerald-500/10 py-1 rounded">
                      Current Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Highlights of selected plan */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
              {currentPlanObj.name} Features Included:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentPlanObj.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-white/80"
                >
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
              <span>Select Payment Method</span>
              <span className="text-[10px] text-white/40 flex items-center gap-1 font-normal">
                <Lock className="size-3" />
                256-Bit Encrypted Secure
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === "upi"
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <Smartphone className="size-4 text-emerald-400" />
                <span>UPI / GPay / PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <CreditCard className="size-4 text-sky-400" />
                <span>Card / RuPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("netbanking")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === "netbanking"
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <Building2 className="size-4 text-amber-400" />
                <span>Net Banking</span>
              </button>
            </div>

            {paymentMethod === "upi" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="Enter UPI ID (e.g. yourname@upi)"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="p-5 border-t border-white/10 bg-[#0d0d12] flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] text-white/50">Total Amount</div>
            <div className="text-sm sm:text-base font-bold text-white">
              {priceText}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activePlan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelSubscription();
                  onClose();
                }}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                Cancel Subscription
              </Button>
            )}

            <Button
              variant="cinema"
              size="lg"
              disabled={isProcessing}
              onClick={handleSubscribe}
              className="px-6 text-sm font-bold gap-2 cursor-pointer"
            >
              <ShieldCheck className="size-4" />
              <span>
                {isProcessing
                  ? "Activating VIP…"
                  : activePlan === selectedPlanId
                    ? "Confirm Current Plan"
                    : `Subscribe to ${currentPlanObj.name}`}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
