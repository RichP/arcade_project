import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Arcade uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero header */}
      <header className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-lg">
        <p className="text-xs uppercase tracking-wider text-white/50">Policy</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-fuchsia-400">
          Cookie Policy
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
            <span aria-hidden>🗓️</span>
            Last updated: 12 August 2025
          </span>
          <span className="hidden sm:inline text-white/40">•</span>
          <span className="hidden sm:inline">Effective immediately</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main content */}
        <article className="space-y-4">
          {/* Intro */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <div className="prose prose-invert">
              <p>
                This Cookie Policy explains how Arcade (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar technologies on
                our website and services (the &quot;Service&quot;).
              </p>
            </div>
          </section>

          {/* What are cookies */}
          <section id="what-are-cookies" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🍪</span> What Are Cookies?
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                Cookies are small text files stored on your device by your browser. They help websites remember your
                actions and preferences over time.
              </p>
            </div>
          </section>

          {/* Types of cookies */}
          <section id="types" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🧰</span> Types of Cookies We Use
            </h2>
            <div className="prose prose-invert mt-2">
              <ul>
                <li>
                  <strong>Essential cookies</strong>: Required for core functionality, such as navigation and security. You
                  cannot opt out of these.
                </li>
                <li>
                  <strong>Preference cookies</strong>: Remember choices like layout or view settings (e.g., favorites or sidebar state).
                </li>
                <li>
                  <strong>Analytics cookies</strong>: Help us understand how the Service is used and improve performance.
                </li>
              </ul>
            </div>
          </section>

          {/* Managing cookies */}
          <section id="managing" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🛠️</span> Managing Cookies
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                You can set your browser to block or delete cookies. Doing so may affect how the Service functions. Browser
                help pages and privacy settings provide controls for cookie management.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section id="changes" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🔄</span> Changes to This Policy
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                We may update this Cookie Policy from time to time. We&apos;ll post the updated version here with its effective
                date.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>✉️</span> Contact
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                If you have questions about this Cookie Policy, please contact the site administrator.
              </p>
            </div>
          </section>

          <div className="text-right text-xs text-white/60">
            <a href="#" className="hover:text-white/80">Back to top ↑</a>
          </div>
        </article>

        {/* Sticky table of contents */}
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm shadow-md">
            <div className="text-white/60 uppercase tracking-wide text-xs mb-2">On this page</div>
            <ul className="space-y-1 text-white/80">
              <li><a className="hover:text-white" href="#what-are-cookies">🍪 What Are Cookies?</a></li>
              <li><a className="hover:text-white" href="#types">🧰 Types of Cookies</a></li>
              <li><a className="hover:text-white" href="#managing">🛠️ Managing Cookies</a></li>
              <li><a className="hover:text-white" href="#changes">🔄 Changes</a></li>
              <li><a className="hover:text-white" href="#contact">✉️ Contact</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
