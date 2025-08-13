"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let idSeq = 1;
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<{ message: string }>;
      const message = ce.detail?.message || "";
      if (!message) return;
      const id = idSeq++;
      setToasts((t) => [...t, { id, message }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    };
    window.addEventListener("app:toast", onToast as EventListener);
    return () => window.removeEventListener("app:toast", onToast as EventListener);
  }, []);

  return (
    <div className="toaster pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item">
          <div className="toast-inner">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
