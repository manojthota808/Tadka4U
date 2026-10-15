import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Crown,
  Check,
  X as XIcon,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Tv,
  Smartphone,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout, pageHead, useAccount } from "@/frontend";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FAQS,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";
import { SubscriptionModal } from "@/frontend/components/subscription/SubscriptionModal";

export const Route = createFileRoute("/plans")({
  head: () =>
    pageHead(
      "Subscription Plans & VIP Membership",
      "Choose your Tadka4U plan. Stream all short dramas in 1080p Full HD and 4K Ultra HD with zero buffering.",
    ),
  component: PlansPage,
});

function PlansPage() {
  const { plan: activePlan, isVip } = useAccount();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [checkoutPlanId, setCheckoutPlanId] = useState<
    "mobile" | "super" | "premium" | null
  >(null);

  return (
    <PageLayout>
      <main className="inner-page max-w-7xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase">
            <Crown className="size-3.5" />
            <span>Tadka4U VIP Cinema Memberships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white m-0">
            Simple, Transparent Plans.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">
              Zero Buffering.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
            Enjoy full, unrestricted access to all Indian short drama episodes,
            crystal-clear 1080p and 4K Ultra HD, and multi-device streaming
            powered by Google Cloud.
          </p>

          {/* Billing & Currency Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center p-1.5 bg-card/80 border border-border/80 rounded-2xl shadow-xl">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billing === "monthly"
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  billing === "annual"
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SAVE 30%
                </span>
              </button>
            </div>

            {/* Currency Selector */}
            <div className="inline-flex items-center p-1.5 bg-card/80 border border-border/80 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPopular = plan.isPopular;
            const isCurrent = activePlan === plan.id;
            const price =
              currency === "INR"
                ? billing === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice
                : billing === "annual"
                  ? plan.usdAnnualPrice
                  : plan.usdMonthlyPrice;

            const symbol = currency === "INR" ? "₹" : "$";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? "bg-gradient-to-b from-[#1c1c24] via-[#121217] to-[#0d0d12] border-2 border-primary shadow-2xl shadow-primary/25 md:-translate-y-2"
                    : "bg-card/60 border border-border/80 hover:border-border hover:bg-card/90"
                }`}
              >
                {/* Popular / Elite Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-extrabold tracking-widest px-3.5 py-1 rounded-full bg-primary text-white uppercase shadow-md shadow-primary/40 flex items-center gap-1.5">
                      <Sparkles className="size-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white m-0">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/60 m-0 min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {symbol}
                        {price}
                      </span>
                      <span className="text-xs text-white/60 font-semibold">
                        / month
                      </span>
                    </div>
                    {billing === "annual" && (
                      <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                        Billed annually ({symbol}
                        {currency === "INR"
                          ? plan.annualTotal
                          : (plan.usdAnnualPrice * 12).toFixed(2)}
                        /yr)
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-3 mb-8">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                      What's Included:
                    </div>
                    {plan.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-white/85 leading-snug"
                      >
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Button */}
                <div>
                  <Button
                    variant={isPopular ? "cinema" : "outline"}
                    size="lg"
                    onClick={() => setCheckoutPlanId(plan.id)}
                    className={`w-full font-bold text-xs sm:text-sm py-5 rounded-2xl cursor-pointer ${
                      isPopular
                        ? "shadow-lg shadow-primary/30"
                        : "border-white/20 hover:bg-white/10 text-white"
                    }`}
                  >
                    {isCurrent
                      ? "Manage Plan"
                      : isPopular
                        ? "Get Super Tadka (Best Value)"
                        : `Choose ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight m-0">
              Compare Plan Features
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5">
              Find the tier that matches your favorite screen and audio setup.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md shadow-2xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 sm:p-5 font-bold text-white">Features</th>
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <th
                      key={p.id}
                      className={`p-4 sm:p-5 font-bold text-center ${
                        p.isPopular
                          ? "text-primary bg-primary/10"
                          : "text-white"
                      }`}
                    >
                      <div className="text-sm sm:text-base">{p.name}</div>
                      <div className="text-[11px] font-normal text-white/60">
                        {p.resolution}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Video Resolution
                  </td>
                  <td className="p-4 sm:p-5 text-center">720p HD</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-white bg-primary/5">
                    1080p Full HD
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-400">
                    4K Ultra HD + HDR
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Simultaneous Screens
                  </td>
                  <td className="p-4 sm:p-5 text-center">1 Screen</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-white bg-primary/5">
                    2 Screens
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-white">
                    4 Screens
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Supported Devices
                  </td>
                  <td className="p-4 sm:p-5 text-center">Phone, Tablet</td>
                  <td className="p-4 sm:p-5 text-center bg-primary/5">
                    TV, Laptop, Phone, Tablet
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    TV, Laptop, Phone, Tablet
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Audio Quality
                  </td>
                  <td className="p-4 sm:p-5 text-center">Stereo 2.0</td>
                  <td className="p-4 sm:p-5 text-center bg-primary/5">
                    Dolby 5.1 Surround
                  </td>
                  <td className="p-4 sm:p-5 text-center text-amber-400 font-bold">
                    Dolby Atmos 3D
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Google Cloud 5 TB High Speed
                  </td>
                  <td className="p-4 sm:p-5 text-center">Standard Fast</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400 font-bold bg-primary/5">
                    Ultra-Fast Edge (0.5s)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400 font-bold">
                    VIP Dedicated Bandwidth
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    24h Early Access to Releases
                  </td>
                  <td className="p-4 sm:p-5 text-center text-white/30">
                    <XIcon className="size-4 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-primary bg-primary/5">
                    <Check className="size-4 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-primary">
                    <Check className="size-4 mx-auto" />
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    Offline Downloads
                  </td>
                  <td className="p-4 sm:p-5 text-center">1 Device</td>
                  <td className="p-4 sm:p-5 text-center bg-primary/5">
                    2 Devices
                  </td>
                  <td className="p-4 sm:p-5 text-center">4 Devices</td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">
                    VIP Director's Cuts & BTS
                  </td>
                  <td className="p-4 sm:p-5 text-center text-white/30">
                    <XIcon className="size-4 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-white/30 bg-primary/5">
                    <XIcon className="size-4 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-primary">
                    <Check className="size-4 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="max-w-3xl mx-auto mb-16 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight m-0">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-white/60 m-0">
              Everything you need to know about Tadka4U subscriptions.
            </p>
          </div>

          <div className="space-y-4">
            {SUBSCRIPTION_FAQS.map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-card/60 border border-border/80 space-y-2"
              >
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 m-0">
                  <HelpCircle className="size-4 text-primary shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed m-0 pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Guarantee Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-card via-[#121217] to-card border border-border/80 text-center max-w-4xl mx-auto space-y-3">
          <div className="size-12 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white m-0">
            Secure 256-Bit SSL Encrypted Checkout
          </h3>
          <p className="text-xs text-white/60 max-w-lg mx-auto m-0">
            Cancel with one tap anytime. We support UPI, RuPay, Visa,
            Mastercard, and Net Banking across all banks in India and worldwide.
          </p>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutPlanId && (
        <SubscriptionModal
          isOpen={Boolean(checkoutPlanId)}
          onClose={() => setCheckoutPlanId(null)}
          defaultPlanId={checkoutPlanId}
        />
      )}
    </PageLayout>
  );
}
