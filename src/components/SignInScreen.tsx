import Image from "next/image";

import { isAuthConfigured, missingAuthEnv, signIn } from "@/lib/auth";

/**
 * The pre-authentication screen.
 *
 * The whole portal sits behind this: nothing about a client's data — not the
 * dashboards they have configured, not their agents, not even their name in the
 * header — is rendered before someone signs in.
 *
 * Deliberately without the top nav. §5 requires the nav on every page *of the
 * app*, so a user is never stranded without a way back to the other tabs; here
 * there is nowhere to go until you sign in, and four dead links would be noise.
 * The NuAIg footer credit stays, because §8 is not conditional.
 */
export function SignInScreen({ clientName }: { clientName: string }) {
  const configured = isAuthConfigured();

  return (
    <div className="chrome-header flex min-h-full flex-col text-white">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-1.5">
            <Image
              src="/nuiq-logo.png"
              alt=""
              width={96}
              height={96}
              priority
              className="h-12 w-12"
            />
            <span className="bg-gradient-to-br from-white via-peak-200 to-peak-500 bg-clip-text text-[30px] font-semibold leading-none tracking-[-0.03em] text-transparent">
              NuIQ
            </span>
          </div>

          <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to continue
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-peak-100/70">
              {clientName}&rsquo;s data intelligence portal. Use the Microsoft
              account you already sign in to work with — NuIQ shows you only
              what that account is entitled to see.
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
                  className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-peak-900 transition-colors hover:bg-peak-100"
                >
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

      {/* Brand rule §8: present on every page, in every deployment. */}
      <footer className="border-t border-white/10 px-6 py-6">
        <a
          href="https://www.nuaig.ai"
          target="_blank"
          rel="noreferrer noopener"
          className="mx-auto flex w-fit items-center gap-2.5"
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
      </footer>
    </div>
  );
}
