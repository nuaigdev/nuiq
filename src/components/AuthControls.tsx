import { auth, isAuthConfigured, missingAuthEnv } from "@/lib/auth";
import { signIn, signOut } from "@/lib/auth";

/**
 * Sign in / sign out, rendered into the header.
 *
 * Server component: sign-in and sign-out run as server actions so no auth
 * plumbing is exposed to the client.
 */
export async function AuthControls() {
  if (!isAuthConfigured()) {
    return (
      <span
        title={`Sign-in is not configured: ${missingAuthEnv().join(", ")} not set`}
        className="rounded border border-dashed border-white/20 px-3 py-1.5 text-xs text-peak-100/50"
      >
        Sign-in not configured
      </span>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id");
        }}
      >
        <button
          type="submit"
          className="rounded border border-white/20 px-3.5 py-1.5 text-sm text-peak-100 transition-colors hover:border-white/40 hover:text-white"
        >
          Sign in
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-peak-100/80 sm:block">
        {session.user.name ?? session.user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="text-sm text-peak-100/50 transition-colors hover:text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
