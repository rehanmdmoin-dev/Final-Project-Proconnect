import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Check, CheckCircle2, Sparkles } from "lucide-react";

const proof = [
  "Every application timestamped from sent to offer",
  "Filters that match how people actually search",
  "One profile, reused on every application",
];

export default function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="auth-theme min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="auth-brand-panel relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-[#123b35] lg:flex xl:p-16">
        <div
          className="pointer-events-none absolute -left-28 -top-28 h-[430px] w-[430px] rounded-full border border-white/65 bg-white/25"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full border border-white/55 bg-[#83d2ae]/20" aria-hidden />
        <div className="pointer-events-none absolute right-[8%] top-[18%] h-56 w-56 rounded-full border border-white/55" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(140deg,#30b88e,#087f68)] font-display text-[15px] font-bold text-white shadow-[0_5px_12px_rgba(8,127,104,0.18)]">P</span>
          <span className="font-display text-[18px] font-semibold tracking-[-0.03em]">ProConnect</span>
        </Link>

        <div className="relative z-10 my-auto max-w-[560px] py-12">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-[#087f68] shadow-[0_3px_12px_rgba(28,92,70,0.04)]">
            <Sparkles size={13} />
            Your next chapter starts here
          </span>
          <h2 className="max-w-[520px] font-display text-[42px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#123b35] xl:text-[50px]">
            Make your next move{" "}
            <span className="mt-2 inline-flex rounded-[16px] bg-[#087f68] px-3.5 py-1 text-white shadow-[0_9px_24px_rgba(8,127,104,0.16)]">
              count.
            </span>
          </h2>
          <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-[#4f7268]">
            Find roles that fit, keep your applications organized, and stay close to every opportunity.
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {proof.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[13px] text-[#557169]">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#159878]" />
                {p}
              </li>
            ))}
          </ul>

          <div className="relative mt-9 max-w-[390px] rounded-[22px] border border-white/90 bg-white/85 p-4 shadow-[0_18px_50px_rgba(22,91,67,0.12)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f7ef] text-[#087f68]">
                <BriefcaseBusiness size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#23483e]">Your search, moving forward</p>
                <p className="mt-0.5 text-[11px] text-[#809a90]">Every opportunity in one clear place</p>
              </div>
              <ArrowUpRight size={17} className="text-[#159878]" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[0, 1, 2, 3].map((step) => (
                <span key={step} className={`grid h-7 w-7 place-items-center rounded-full ${step < 2 ? "bg-[#087f68] text-white" : "border border-[#d8e8e0] bg-white text-[#9ab1a7]"}`}>
                  {step < 2 ? <Check size={13} strokeWidth={2.7} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
              ))}
              <span className="ml-1 text-[11px] text-[#668078]">Applied · Review · Interview · Offer</span>
            </div>
          </div>
        </div>

        <p className="relative text-[12px] text-[#78958a]">© {new Date().getFullYear()} ProConnect</p>
      </div>

      <div className="auth-form-panel flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[440px] rise">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(140deg,#30b88e,#087f68)] font-display text-[15px] font-bold text-white shadow-[0_5px_12px_rgba(8,127,104,0.16)]">P</span>
            <span className="font-display text-[18px] font-semibold tracking-[-0.03em] text-ink">ProConnect</span>
          </Link>

          <div className="auth-form-card rounded-[24px] border border-white/90 bg-white p-6 shadow-[0_18px_55px_rgba(22,91,67,0.09)] sm:p-9">
            <h1 className="font-display text-[28px] font-semibold tracking-[-0.04em] text-ink">{title}</h1>
            <p className="mb-7 mt-1.5 text-[14px] leading-6 text-muted">{subtitle}</p>

            {children}

            {footer && <div className="mt-7 border-t border-line-soft pt-5 text-center text-[13.5px] text-muted">{footer}</div>}
          </div>
          <p className="mt-6 text-center text-[11.5px] text-[#89a197] lg:hidden">
            © {new Date().getFullYear()} ProConnect
          </p>
        </div>
      </div>
    </div>
  );
}
