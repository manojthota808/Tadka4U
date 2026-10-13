import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, pageHead } from "@/frontend";

export const Route = createFileRoute("/sign-up/$")({
  head: () =>
    pageHead(
      "Create account",
      "Sign up for Tadka4U to enjoy unlimited short-form cinematic dramas.",
    ),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <PageLayout>
      <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
        <SignUp />
      </div>
    </PageLayout>
  );
}
