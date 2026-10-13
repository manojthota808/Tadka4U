import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authApi } from "@/api";
import { Button } from "@/components/ui/button";
import { PageLayout, pageHead } from "@/frontend";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead(
      "Reset password",
      "Choose a new password for your Tadka4U account.",
    ),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authApi.updatePassword(password);
    setMessage(
      error
        ? error.message
        : "Your password has been updated. You can now sign in.",
    );
    setBusy(false);
  }

  return (
    <PageLayout>
      <main className="inner-page">
        <form className="auth-panel" onSubmit={submit}>
          <h1>A fresh start.</h1>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            className="search-input"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="cinema"
            className="w-full mt-5"
            type="submit"
            disabled={busy}
          >
            {busy ? "Updating…" : "Update password"}
          </Button>
          {message && (
            <div className="message" role="status">
              {message}
            </div>
          )}
        </form>
      </main>
    </PageLayout>
  );
}
