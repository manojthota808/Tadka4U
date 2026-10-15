export interface SubscriptionPlan {
  id: "mobile" | "super" | "premium";
  name: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  monthlyPrice: number;
  annualPrice: number; // Annual equivalent per month or total
  annualTotal: number;
  currency: string;
  currencySymbol: string;
  usdMonthlyPrice: number;
  usdAnnualPrice: number;
  videoQuality: string;
  resolution: string;
  supportedDevices: string[];
  concurrentScreens: number;
  downloadDevices: number;
  audioQuality: string;
  highlights: string[];
  features: {
    name: string;
    value: string | boolean;
  }[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "mobile",
    name: "Tadka Mobile",
    tagline: "Essential short drama streaming on phone & tablet",
    monthlyPrice: 99,
    annualPrice: 69,
    annualTotal: 828,
    currency: "INR",
    currencySymbol: "₹",
    usdMonthlyPrice: 1.49,
    usdAnnualPrice: 0.99,
    videoQuality: "Good (720p HD)",
    resolution: "720p HD",
    supportedDevices: ["Mobile Phone", "Tablet"],
    concurrentScreens: 1,
    downloadDevices: 1,
    audioQuality: "Standard Stereo",
    highlights: [
      "Stream all short dramas & episodes",
      "Ad-free uninterrupted viewing",
      "Single mobile device streaming",
      "Standard cloud streaming speed",
    ],
    features: [
      { name: "Video Resolution", value: "720p HD" },
      { name: "Simultaneous Screens", value: "1 Screen" },
      { name: "Devices Supported", value: "Phone & Tablet" },
      { name: "Audio Format", value: "Stereo 2.0" },
      { name: "Ad-Free Streaming", value: true },
      { name: "Google Cloud Fast CDN", value: "Standard" },
      { name: "Early Access to Releases", value: false },
      { name: "Offline Episode Downloads", value: "1 Device" },
      { name: "VIP Director's Cuts", value: false },
    ],
  },
  {
    id: "super",
    name: "Super Tadka",
    tagline: "Full HD cinematic streaming on TV, Laptop & Mobile",
    badge: "MOST POPULAR",
    isPopular: true,
    monthlyPrice: 199,
    annualPrice: 139,
    annualTotal: 1668,
    currency: "INR",
    currencySymbol: "₹",
    usdMonthlyPrice: 2.99,
    usdAnnualPrice: 1.99,
    videoQuality: "Great (1080p Full HD)",
    resolution: "1080p Full HD",
    supportedDevices: ["TV", "Laptop", "Mobile Phone", "Tablet"],
    concurrentScreens: 2,
    downloadDevices: 2,
    audioQuality: "Dolby 5.1 Surround",
    highlights: [
      "1080p Full HD crystal-clear streams",
      "Watch on TV, Laptop & Mobile at once",
      "Google Cloud 5 TB High-Speed Bandwidth",
      "24h Early Access to all New Releases",
      "Offline episode downloads on 2 devices",
    ],
    features: [
      { name: "Video Resolution", value: "1080p Full HD" },
      { name: "Simultaneous Screens", value: "2 Screens" },
      { name: "Devices Supported", value: "TV, Laptop, Phone & Tablet" },
      { name: "Audio Format", value: "Dolby 5.1 Surround" },
      { name: "Ad-Free Streaming", value: true },
      { name: "Google Cloud Fast CDN", value: "Ultra-Fast (0.5s start)" },
      { name: "Early Access to Releases", value: true },
      { name: "Offline Episode Downloads", value: "2 Devices" },
      { name: "VIP Director's Cuts", value: false },
    ],
  },
  {
    id: "premium",
    name: "Premium VIP Cinema",
    tagline: "4K Ultra HD, Dolby Atmos, and 4 screens for family & friends",
    badge: "VIP ELITE",
    monthlyPrice: 399,
    annualPrice: 279,
    annualTotal: 3348,
    currency: "INR",
    currencySymbol: "₹",
    usdMonthlyPrice: 4.99,
    usdAnnualPrice: 3.49,
    videoQuality: "Best (4K Ultra HD + HDR)",
    resolution: "4K Ultra HD + HDR",
    supportedDevices: ["TV", "Laptop", "Mobile Phone", "Tablet"],
    concurrentScreens: 4,
    downloadDevices: 4,
    audioQuality: "Dolby Atmos Spatial Audio",
    highlights: [
      "4K Ultra HD + HDR cinematic quality",
      "4 Screens streaming simultaneously",
      "Dolby Atmos 3D spatial surround sound",
      "Dedicated Google Cloud VIP stream pipes",
      "Exclusive Director's Cuts & Extended Endings",
      "Priority 24/7 VIP Concierge Support",
    ],
    features: [
      { name: "Video Resolution", value: "4K Ultra HD + HDR" },
      { name: "Simultaneous Screens", value: "4 Screens" },
      { name: "Devices Supported", value: "TV, Laptop, Phone & Tablet" },
      { name: "Audio Format", value: "Dolby Atmos Spatial" },
      { name: "Ad-Free Streaming", value: true },
      { name: "Google Cloud Fast CDN", value: "Dedicated VIP Pipe" },
      { name: "Early Access to Releases", value: true },
      { name: "Offline Episode Downloads", value: "4 Devices" },
      { name: "VIP Director's Cuts", value: true },
    ],
  },
];

export const SUBSCRIPTION_FAQS = [
  {
    q: "Can I cancel or switch my plan anytime?",
    a: "Yes! There are no lock-in contracts. You can upgrade, downgrade, or cancel your Tadka4U plan with a single click in your account settings.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support all major payment methods across India & internationally: UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay, Visa, Mastercard, Net Banking, and international credit cards.",
  },
  {
    q: "How fast is streaming with Google Cloud?",
    a: "Tadka4U streams directly from Google Cloud's 5 TB high-performance edge storage with HTTP 206 byte-range streaming, allowing episodes to start playing instantly in under 0.5 seconds with zero buffering.",
  },
  {
    q: "Can I watch Tadka4U on my Smart TV?",
    a: "Yes! Super Tadka and Premium VIP Cinema tiers support streaming on Android TV, Apple TV, Fire TV, web browsers, and tablets.",
  },
];

export const ACTIVE_PLAN_STORAGE_KEY = "tadka4u_active_plan";

export function getStoredSubscription(): {
  planId: "mobile" | "super" | "premium" | null;
  subscribedAt: string | null;
  billing: "monthly" | "annual";
} {
  if (typeof window === "undefined" || !window.localStorage) {
    return { planId: null, subscribedAt: null, billing: "monthly" };
  }
  try {
    const raw = window.localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
    if (!raw) return { planId: null, subscribedAt: null, billing: "monthly" };
    return JSON.parse(raw);
  } catch {
    return { planId: null, subscribedAt: null, billing: "monthly" };
  }
}

export function saveStoredSubscription(
  planId: "mobile" | "super" | "premium" | null,
  billing: "monthly" | "annual" = "monthly",
) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (planId === null) {
      window.localStorage.removeItem(ACTIVE_PLAN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        ACTIVE_PLAN_STORAGE_KEY,
        JSON.stringify({
          planId,
          subscribedAt: new Date().toISOString(),
          billing,
        }),
      );
    }
  } catch {
    // no-op
  }
}
