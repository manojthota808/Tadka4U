import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { PageLayout, pageHead } from "@/frontend";

export const Route = createFileRoute("/auth")({
  head: () =>
    pageHead(
      "Sign in",
      "Sign in to Tadka4U to save your favorite short dramas and discover your next story.",
    ),
  component: Auth,
});

function Auth() {
  return (
    <PageLayout>
      <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
        <SignIn />
      </div>
    </PageLayout>
  );
}
