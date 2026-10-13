import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, pageHead } from "@/frontend";

export const Route = createFileRoute("/sign-in/$")({
  head: () =>
    pageHead(
      "Sign in",
      "Sign in to your Tadka4U account to save favorites and resume watching.",
    ),
  component: SignInPage,
});

function SignInPage() {
  return (
    <PageLayout>
      <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
        <SignIn />
      </div>
    </PageLayout>
  );
}
