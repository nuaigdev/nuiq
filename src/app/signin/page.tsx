export const metadata = { title: "Sign in" };

/**
 * The sign-in route.
 *
 * Intentionally empty: the root layout renders the sign-in screen whenever
 * there is no session, so this page exists only to give the proxy somewhere to
 * send people. Keeping it empty means there is no page content to leak into the
 * RSC payload for a signed-out visitor.
 */
export default function SignInPage() {
  return null;
}
