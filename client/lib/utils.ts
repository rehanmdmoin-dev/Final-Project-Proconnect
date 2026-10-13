export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export const fmtSalary = (s?: { min?: number; max?: number; currency?: string; isDisclosed?: boolean }) => {
  if (!s || !s.isDisclosed || (!s.min && !s.max)) return null;
  const short = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L` : `${Math.round(n / 1000)}k`);
  const sym = s.currency === "INR" ? "₹" : "$";
  if (s.min && s.max) return `${sym}${short(s.min)} – ${sym}${short(s.max)}`;
  return `${sym}${short((s.min || s.max)!)}`;
};
