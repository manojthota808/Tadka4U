import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, pageHead } from "@/frontend";
export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy",
      "How account details and saved lists are used in the Tadka4U demonstration.",
    ),
  component: Privacy,
});
function Privacy() {
  return (
    <PageLayout>
      <main className="inner-page">
        <h1>Privacy</h1>
        <div className="prose">
          <p>
            This demonstration stores the account details needed to sign in and
            the shows you add to My List. Your saved list is restricted to your
            own signed-in account.
          </p>
          <h2>Account information</h2>
          <p>
            Email and authentication information are managed through Lovable
            Cloud. Google sign-in is optional. Passwords are handled by the
            authentication service and are not displayed in this website.
          </p>
          <h2>Your saved shows</h2>
          <p>
            You can remove a saved show at any time from My List. Signing out
            ends access to your list on this device.
          </p>
          <h2>External destinations</h2>
          <p>
            App store and original-site links leave this demonstration. Their
            own privacy terms apply. This summary is not a production legal
            policy; an operator-specific policy is required before commercial
            launch.
          </p>
        </div>
      </main>
    </PageLayout>
  );
}
