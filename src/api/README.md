# 🌐 Tadka4U API Layer (`src/api`)

The API layer acts as the centralized contract and communication interface between the user interface and backend services (Supabase & Lovable Cloud).

---

## 📁 Directory Structure

```
src/api/
├── auth.ts              # Authentication services (sign-in, sign-up, OAuth, reset password)
├── catalog.ts           # Shows catalog queries, genre listing, search & filtering
├── watchlist.ts         # User watchlist persistence operations (add, remove, toggle)
├── client.ts            # Client instances for Supabase and Lovable Cloud
├── types.ts             # Domain models (Show, Genre, WatchlistItem, User, Session, etc.)
├── README.md            # API documentation
└── index.ts             # Centralized barrel export
```

---

## 🚀 Key Services

### 1. `authApi` (`src/api/auth.ts`)

- `getSession()`: Retrieves currently authenticated session.
- `onAuthStateChange(callback)`: Real-time auth status subscription.
- `signInWithEmail(email, password)`: Email/password authentication.
- `signUpWithEmail(email, password)`: User registration.
- `signInWithGoogle()`: OAuth login via Lovable Cloud integration.
- `resetPasswordForEmail(email)`: Password recovery email trigger.
- `updatePassword(password)`: Sets a new password for authenticated user.
- `signOut()`: Logs out current user.

### 2. `catalogApi` (`src/api/catalog.ts`)

- `getAllShows()`: Returns all available shows.
- `getShowById(id)`: Returns a single show matching unique ID.
- `getGenres()`: Returns list of genres (including "All").
- `filterShows(genre, search)`: Filters shows by selected genre and case-insensitive keyword.
- `getFeaturedShows()`: Returns spotlighted / badge-bearing shows.

### 3. `watchlistApi` (`src/api/watchlist.ts`)

- `getUserWatchlist(userId)`: Fetches list of saved show IDs for the user.
- `addToWatchlist(userId, showId)`: Adds show ID to user's saved list.
- `removeFromWatchlist(userId, showId)`: Removes show ID from user's saved list.
- `toggleWatchlist(userId, showId, isCurrentlySaved)`: Toggles show saved state.

---

## 💡 Quick Example

```typescript
import { catalogApi, authApi, watchlistApi } from "@/api";

// Fetch catalog shows
const dramaShows = catalogApi.filterShows("Drama");

// Listen for auth changes
const unsubscribe = authApi.onAuthStateChange((user, session) => {
  console.log("Current user:", user?.email);
});

// Update watchlist
await watchlistApi.addToWatchlist(user.id, "midnight-promise");
```
