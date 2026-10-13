import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, pageHead } from "@/frontend";
export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "Terms",
      "Terms and demonstration limitations of this Tadka4U streaming experience.",
    ),
  component: Terms,
});
function Terms() {
  return (
    <PageLayout>
      <main className="inner-page">
        <h1>Terms</h1>
        <div className="prose">
          <h2>A demonstration experience</h2>
          <p>
            This website is an independently created Tadka4U demonstration. The
            catalog and generated artwork are illustrative, and full episodes
            are not available.
          </p>
          <h2>Accounts</h2>
          <p>
            Use an email address you control when creating an account. Your
            account allows you to save and remove shows from your personal list.
          </p>
          <h2>No payments</h2>
          <p>
            This website does not collect subscription payments or grant access
            to paid content. External app links point to the original service,
            whose terms apply separately.
          </p>
          <h2>Before commercial launch</h2>
          <p>
            Licensed media, operator details, appropriate privacy and service
            policies, and any subscription infrastructure must be supplied
            before this demonstration can operate as a commercial streaming
            platform.
          </p>
        </div>
      </main>
    </PageLayout>
  );
}
