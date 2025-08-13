import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Arcade collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero header */}
      <header className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-lg">
        <p className="text-xs uppercase tracking-wider text-white/50">Policy</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-fuchsia-400">
          Privacy Policy
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
                This Privacy Policy explains how Arcade (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
                information in connection with our website and services (the &quot;Service&quot;).
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section id="info-we-collect" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>📥</span> Information We Collect
            </h2>
            <div className="prose prose-invert mt-2">
              <ul>
                <li>
                  Usage data such as pages viewed, interactions, and referring URLs. This may be collected via
                  analytics tools and server logs.
                </li>
                <li>
                  Device and browser information such as IP address, user agent, and general location inferred from IP.
                </li>
                <li>
                  Preferences you choose on the site (for example, favorites) which may be stored in local storage or
                  cookies on your device.
                </li>
              </ul>
            </div>
          </section>

          {/* How we use */}
          <section id="how-we-use" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>⚙️</span> How We Use Information
            </h2>
            <div className="prose prose-invert mt-2">
              <ul>
                <li>To operate, maintain, and improve the Service.</li>
                <li>To personalize your experience (e.g., favorites, layout preferences).</li>
                <li>To monitor performance, detect abuse, and ensure reliability.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section id="cookies" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🍪</span> Cookies and Similar Technologies
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                We use cookies and similar technologies to remember preferences, measure performance, and improve the
                Service. For more details, see our <a href="/cookies">Cookie Policy</a>.
              </p>
            </div>
          </section>

          {/* Third-party */}
          <section id="third-party" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🔗</span> Third-Party Content and Links
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                The Service may link to or embed third-party content (including games). These third parties may collect
                information subject to their own privacy policies. We are not responsible for the privacy practices of
                third-party sites or services.
              </p>
            </div>
          </section>

          {/* Retention */}
          <section id="data-retention" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🗄️</span> Data Retention
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                We retain information only as long as necessary to provide the Service and for legitimate business or
                legal purposes.
              </p>
            </div>
          </section>

          {/* Children */}
          <section id="children" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🧒</span> Children&apos;s Privacy
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                The Service is not directed to children under the age of 13, and we do not knowingly collect personal
                information from children. If you believe a child has provided us information, please contact us so we
                can take appropriate action.
              </p>
            </div>
          </section>

          {/* Choices */}
          <section id="your-choices" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🧭</span> Your Choices
            </h2>
            <div className="prose prose-invert mt-2">
              <ul>
                <li>You can manage cookies via your browser settings or our cookie controls.</li>
                <li>You may clear local preferences (e.g., favorites) from your browser&apos;s storage.</li>
              </ul>
            </div>
          </section>

          {/* Changes */}
          <section id="changes" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🔄</span> Changes to This Policy
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                We may update this Privacy Policy from time to time. We&apos;ll post the updated version here with its
                effective date.
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
                If you have questions about this Privacy Policy, please contact the site administrator.
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
              <li><a className="hover:text-white" href="#info-we-collect">📥 Information We Collect</a></li>
              <li><a className="hover:text-white" href="#how-we-use">⚙️ How We Use Information</a></li>
              <li><a className="hover:text-white" href="#cookies">🍪 Cookies</a></li>
              <li><a className="hover:text-white" href="#third-party">🔗 Third-Party Content</a></li>
              <li><a className="hover:text-white" href="#data-retention">🗄️ Data Retention</a></li>
              <li><a className="hover:text-white" href="#children">🧒 Children&apos;s Privacy</a></li>
              <li><a className="hover:text-white" href="#your-choices">🧭 Your Choices</a></li>
              <li><a className="hover:text-white" href="#changes">🔄 Changes</a></li>
              <li><a className="hover:text-white" href="#contact">✉️ Contact</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
