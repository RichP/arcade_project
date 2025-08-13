import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Arcade.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero header */}
      <header className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-lg">
        <p className="text-xs uppercase tracking-wider text-white/50">Legal</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-fuchsia-400">
          Terms of Service
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
          {/* Acceptance */}
          <section id="acceptance" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>✅</span> Acceptance of Terms
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                By accessing or using Arcade (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do
                not agree to these terms, please do not use the Service.
              </p>
            </div>
          </section>

          {/* Use */}
          <section id="use" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🕹️</span> Use of the Service
            </h2>
            <div className="prose prose-invert mt-2">
              <ul>
                <li>You agree not to misuse the Service or interfere with its operation.</li>
                <li>You will comply with applicable laws when using the Service.</li>
                <li>
                  Third-party content and games are provided under their respective terms. We are not responsible for
                  third-party content.
                </li>
              </ul>
            </div>
          </section>

          {/* IP */}
          <section id="ip" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🧩</span> Intellectual Property
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                The Service&apos;s UI, design elements, and original content are owned by the operator and protected by
                intellectual property laws. Third-party content remains the property of its respective owners.
              </p>
            </div>
          </section>

          {/* Warranty */}
          <section id="warranty" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>⚠️</span> Disclaimer of Warranties
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether
                express or implied.
              </p>
            </div>
          </section>

          {/* Liability */}
          <section id="liability" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🛡️</span> Limitation of Liability
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                To the extent permitted by law, Arcade and its operators will not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section id="changes" className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🔄</span> Changes
            </h2>
            <div className="prose prose-invert mt-2">
              <p>
                We may update these Terms from time to time. We&apos;ll post the updated version here with its effective date.
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
                If you have questions about these Terms, please contact the site administrator.
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
              <li><a className="hover:text-white" href="#acceptance">✅ Acceptance of Terms</a></li>
              <li><a className="hover:text-white" href="#use">🕹️ Use of the Service</a></li>
              <li><a className="hover:text-white" href="#ip">🧩 Intellectual Property</a></li>
              <li><a className="hover:text-white" href="#warranty">⚠️ Disclaimer of Warranties</a></li>
              <li><a className="hover:text-white" href="#liability">🛡️ Limitation of Liability</a></li>
              <li><a className="hover:text-white" href="#changes">🔄 Changes</a></li>
              <li><a className="hover:text-white" href="#contact">✉️ Contact</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
