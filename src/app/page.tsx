import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  // If logged in, go straight to the vault dashboard
  if (session) {
    redirect("/vault");
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-stone flex flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="font-serif text-2xl text-navy">Signal Vault</span>
          </div>
          <p className="text-sm text-warm-gray font-mono uppercase tracking-wider">
            By Signal & Structure AI
          </p>
        </div>

        {/* Headline */}
        <h1 className="page-title mb-4">
          Secure credential vault for AI agents
        </h1>
        <p className="text-warm-gray text-lg mb-8 leading-relaxed">
          Connect your accounts safely. Your AI agents get scoped,
          time-limited access. You stay in control.
        </p>

        {/* CTA — Auth0 login */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/login"
            className="btn btn-copper text-base px-6 py-3"
          >
            Sign In to Signal Vault
          </a>
          <a
            href="https://github.com/TKHatton/signal-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-navy text-base px-6 py-3"
          >
            View on GitHub
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-mono text-navy font-bold">0</div>
            <div className="text-xs text-warm-gray mt-1">
              Passwords stored
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono text-copper font-bold">7</div>
            <div className="text-xs text-warm-gray mt-1">
              Verification steps
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono text-green font-bold">1</div>
            <div className="text-xs text-warm-gray mt-1">
              Click to revoke
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
