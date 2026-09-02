import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The login gate for the whole portal (CLAUDE.md §6).
 *
 * This runs before any route renders, which is the point. Gating inside the
 * root layout is not sufficient on its own: Next still renders `children` and
 * streams the page into the RSC payload, so a signed-out visitor could read a
 * client's dashboard and agent names out of the page source even though nothing
 * was visible on screen. Stopping the request here means the protected page is
 * never rendered at all.
 *
 * The session cookie is verified properly — decrypted and signature-checked
 * with AUTH_SECRET — not merely sniffed for presence. It deliberately does not
 * load the client config: proxy code is meant to stay independent of the render
 * path, and AUTH_SECRET is all a session check needs.
 */

const SIGN_IN_PATH = "/signin";

export async function proxy(request: NextRequest) {
  // Without a secret nothing can be verified. Fail closed: send everyone to the
  // sign-in screen, which explains that auth is not configured.
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
  }

  const token = await getToken({
    req: request,
    secret,
    // Vercel terminates TLS, so the cookie is the __Secure- prefixed one there
    // but not locally. Deriving it from the request URL keeps both working.
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (token) {
    return NextResponse.next();
  }

  const signIn = new URL(SIGN_IN_PATH, request.url);
  return NextResponse.redirect(signIn);
}

export const config = {
  /**
   * Everything except: the sign-in screen itself (or it would loop), NextAuth's
   * own endpoints (sign-in cannot complete without them), and static assets —
   * the logos are needed to render the sign-in screen.
   */
  matcher: [
    "/((?!signin|api/auth|_next/static|_next/image|favicon.ico|nuiq-logo.png|nuaig-logo.svg|nuaig-logo-white.svg).*)",
  ],
};
