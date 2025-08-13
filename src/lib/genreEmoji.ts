// Utility to provide a fallback emoji for a genre name when an admin-selected emoji is not set.
export function fallbackEmojiForGenre(name: string): string | undefined {
  const n = (name || "").toLowerCase();
  if (!n) return undefined;
  if (n.includes("mahjong")) return "🀄";
  if (n.includes("solitaire") || n.includes("klondike") || n.includes("cards") || n.includes("card")) return "🃏";
  if (n.includes("puzzle") || n.includes("match")) return "🧩";
  if (n.includes("hidden")) return "🔎";
  if (n.includes("bubble")) return "🫧";
  if (n.includes("pinball")) return "🎱";
  if (n.includes("arcade")) return "🕹️";
  if (n.includes("brain")) return "🧠";
  if (n.includes("skill")) return "🎯";
  if (n.includes("idle") || n.includes("incremental") || n.includes("clicker")) return "⏱️";
  if (n.includes("management") || n.includes("simulation") || n.includes("craft") || n.includes("building")) return "⚙️";
  return "🏷️";
}

export function emojiForGenre(name: string, adminEmoji?: string): string | undefined {
  return (adminEmoji && adminEmoji.trim()) || fallbackEmojiForGenre(name);
}
