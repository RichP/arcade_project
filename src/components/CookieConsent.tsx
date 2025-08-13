"use client";
import { useEffect, useState } from "react";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 180) {
  if (typeof document === "undefined") return;
  const exp = new Date();
  exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp.toUTCString()}; SameSite=Lax;` + (location.protocol === "https:" ? " Secure;" : "");
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = readCookie("cookie_consent");
    if (!v) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/70 shadow-lg ring-1 ring-black/30">
        <div className="p-4 sm:p-5">
          <p className="text-sm text-zinc-200">
            We use essential cookies to make this site work. With your consent, we may also use additional cookies to understand usage. See our <a className="underline hover:no-underline" href="/cookies">Cookie Policy</a>.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className="inline-flex items-center justify-center rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              onClick={() => {
                setCookie("cookie_consent", "necessary");
                setVisible(false);
              }}
            >
              Only necessary
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              onClick={() => {
                setCookie("cookie_consent", "all");
                setVisible(false);
              }}
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
