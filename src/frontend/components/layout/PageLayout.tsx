import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
