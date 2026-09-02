import Image from "next/image";

import { isAuthConfigured, missingAuthEnv, signIn } from "@/lib/auth";

/**
 * The pre-authentication screen.
 *
 * The whole portal sits behind this: nothing about a client's data — not the
 * dashboards they have configured, not their agents — is rendered before
 * someone signs in.
 *
 * Deliberately without the top nav. §5 requires the nav on every page *of the
 * app*, so a user is never stranded without a way back to the other tabs; here
 * there is nowhere to go until you sign in, and four dead links would be noise.
 * The NuAIg footer credit stays, because §8 is not conditional.
 */

/** The Microsoft four-square mark, as used on their sign-in buttons. */
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 23 23" width="17" height="17" aria-hidden focusable="false">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export function SignInScreen({ clientName }: { clientName: string }) {
  const configured = isAuthConfigured();

  return (
    /* flex-1 rather than a min-height of its own: the body is already a
       full-height flex column, so growing into it keeps the footer on the bottom
       edge at any viewport size instead of floating up the page. */
    <div className="chrome-header flex flex-1 flex-col text-white">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Same treatment as the header: product mark, then client identity
              behind a divider. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Image
                src="/nuiq-logo.png"
                alt=""
                width={96}
                height={96}
                priority
                className="h-11 w-11"
              />
              <span className="bg-gradient-to-br from-white via-peak-200 to-peak-500 bg-clip-text text-[28px] font-semibold leading-none tracking-[-0.03em] text-transparent">
                NuIQ
              </span>
            </div>
            <span aria-hidden className="h-7 w-px bg-white/20" />
            <span className="text-base text-peak-100/85">{clientName}</span>
          </div>

          <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to continue
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-peak-100/70">
              Use the Microsoft account you already sign in to work with. NuIQ
              shows you only what that account is entitled to see.
            </p>

            {configured ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("microsoft-entra-id", { redirectTo: "/" });
                }}
                className="mt-7"
              >
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 py-3 text-sm font-medium text-peak-900 transition-colors hover:bg-peak-100"
                >
                  <MicrosoftMark />
                  Sign in with Microsoft
                </button>
              </form>
            ) : (
              <p className="mt-7 rounded-lg border border-dashed border-white/25 px-4 py-3 text-sm text-peak-100/70">
                Sign-in is not configured for this deployment.
                <span className="mt-1 block font-mono text-xs text-peak-100/50">
                  Missing: {missingAuthEnv().join(", ")}
                </span>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-peak-100/45">
            Access is managed in your organization&rsquo;s Microsoft directory.
            If you cannot sign in, contact your administrator.
          </p>
        </div>
      </main>

      {/* Brand rule §8: present on every page, in every deployment. Matches the
          app footer's container so it lines up at any width. */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center px-6 py-6">
          <a
            href="https://www.nuaig.ai"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2.5"
            aria-label="Powered by NuAIg"
          >
            <span className="text-xs text-peak-100/50">Powered by</span>
            <Image
              src="/nuaig-logo-white.svg"
              alt="NuAIg"
              width={82}
              height={34}
              className="h-[22px] w-auto"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}
