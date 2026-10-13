# 🎨 Tadka4U Frontend Layer (`src/frontend`)

The frontend layer contains all client-side UI, presentation components, state management contexts, React hooks, and display utilities for Tadka4U.

---

## 📁 Directory Structure

```
src/frontend/
├── components/          # Reusable presentation and layout components
│   ├── layout/          # Global application shell & layout components
│   │   ├── Brand.tsx         # Logo and branding link
│   │   ├── Header.tsx        # Top navigation header & mobile drawer
│   │   ├── Footer.tsx        # Bottom links & credits
│   │   ├── AppBand.tsx       # Download app promotional callout
│   │   └── PageLayout.tsx    # Standard shell wrapping header, content, footer
│   ├── streaming/       # Streaming domain components
│   │   ├── Poster.tsx        # Cinematic show poster with badges
│   │   ├── ShowCard.tsx      # Show card with quick watchlist action
│   │   └── Shelf.tsx         # Multi-row auto-scrolling carousel shelf
│   └── ui/              # Atomic UI primitives (Button, Carousel, Dialog)
├── context/             # Global React state providers
│   ├── AccountContext.tsx    # User authentication & watchlist state provider
│   └── ShelfContext.tsx      # Auto-scrolling shelf viewport coordinator
├── hooks/               # Custom React hooks
│   ├── use-account.ts        # Access active user & watchlist methods
│   ├── use-shelf.ts          # Access shelf coordinate state
│   └── use-mobile.tsx        # Mobile viewport breakpoint listener
├── utils/               # Frontend display & SEO helpers
│   └── page-head.ts          # Generates meta tags for TanStack Start routes
└── index.ts             # Centralized barrel export
```

---

## 🚀 Quick Usage

Import any frontend component, hook, or provider cleanly from `@/frontend`:

```tsx
import { PageLayout, ShowCard, Shelf, useAccount, pageHead } from "@/frontend";

export function ExplorePage() {
  const { saved, toggle } = useAccount();

  return (
    <PageLayout>
      <Shelf title="Trending Now" />
    </PageLayout>
  );
}
```

---

## 📐 Guidelines

1. **Keep components focused**: Pure UI presentation logic belongs in `components/`.
2. **Global state in `context/`**: Session and watchlist persistence live in `AccountContext`.
3. **Route views in `src/routes/`**: TanStack Start routes consume `@/frontend` components and `@/api` services.
4. **Semantic styling**: Rely on CSS classes defined in `src/styles.css` using the project's semantic token system.
