"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  FileCheck2,
  MapPin,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchJobs, type Job } from "@/redux/slice/jobSlice";
import { fmtSalary, timeAgo } from "@/lib/utils";

const steps = [
  {
    icon: Search,
    title: "Find the right role",
    body: "Explore openings that match your skills, goals, and preferred way of working.",
  },
  {
    icon: FileCheck2,
    title: "Build your profile",
    body: "Add your experience once and make every application feel effortless.",
  },
  {
    icon: Send,
    title: "Apply with confidence",
    body: "Share your profile and keep a clear record of every application.",
  },
  {
    icon: BadgeCheck,
    title: "Track your progress",
    body: "Know where each opportunity stands, from your first application onward.",
  },
];

function JobPreviewCard({ job }: { job: Job }) {
  const salary = fmtSalary(job.salary);

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="group flex h-full flex-col rounded-2xl border border-[#e3eee9] bg-white p-5 shadow-[0_8px_28px_rgba(15,66,52,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#83cbb2] hover:shadow-[0_16px_36px_rgba(15,66,52,0.1)]"
    >
      <div className="flex items-start gap-3">
        {job.company?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.company.logo}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-[#e8f0ec] object-cover"
          />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f7ef] text-[#087f68]">
            <Building2 size={19} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[16px] font-semibold text-[#123b35] transition-colors group-hover:text-[#087f68]">
            {job.title}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#668078]">{job.company?.name}</p>
        </div>
        <ArrowUpRight
          size={17}
          className="mt-0.5 shrink-0 text-[#91aaa1] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#087f68]"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#e9f7ef] px-3 py-1 text-[12px] font-medium text-[#087f68]">
          {job.workMode}
        </span>
        <span className="rounded-full bg-[#f2f7f4] px-3 py-1 text-[12px] text-[#557169]">
          {job.jobType}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf3f0] pt-4">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-[12.5px] text-[#668078]">
          <MapPin size={14} className="shrink-0 text-[#159878]" />
          {job.location}
        </span>
        <span className="shrink-0 text-[12px] text-[#91aaa1]">{timeAgo(job.createdAt)}</span>
      </div>
      {salary && (
        <p className="mt-3 text-[13px] font-semibold text-[#123b35]">{salary}</p>
      )}
    </Link>
  );
}

export default function Landing() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { jobs } = useAppSelector((state) => state.job);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobsLoaded, setJobsLoaded] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs({ limit: 6, sort: "newest" })).finally(() => setJobsLoaded(true));
  }, [dispatch]);

  const companies = Array.from(
    new Map(
      jobs
        .filter((job) => job.company?.name)
        .map((job) => [job.company._id, job.company])
    ).values()
  ).slice(0, 5);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#fbfefc] text-[#123b35]">
      <header className="sticky top-0 z-30 border-b border-[#e9f1ed] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ProConnect home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(140deg,#30b88e,#087f68)] font-display text-[16px] font-bold text-white shadow-[0_5px_12px_rgba(8,127,104,0.2)]">
              P
            </span>
            <span className="font-display text-[18px] font-semibold tracking-[-0.03em] text-[#123b35]">
              ProConnect
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[13.5px] font-medium text-[#557169] md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="transition hover:text-[#087f68]">How it works</a>
            <a href="#featured-jobs" className="transition hover:text-[#087f68]">Explore jobs</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden rounded-xl px-3 py-2 text-[13px] font-semibold text-[#315c51] transition hover:bg-[#f0f8f4] sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#087f68] px-4 text-[13px] font-semibold text-white shadow-[0_5px_12px_rgba(8,127,104,0.16)] transition hover:bg-[#066b58]"
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[linear-gradient(118deg,#f3fff8_0%,#e0f8ec_46%,#c5eedc_100%)]">
          <div className="pointer-events-none absolute -left-36 top-14 h-80 w-80 rounded-full bg-white/55 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-20 -top-28 h-[460px] w-[460px] rounded-full border border-white/60 bg-[#82d4b2]/20" aria-hidden />
          <div className="pointer-events-none absolute right-[8%] top-24 h-[340px] w-[340px] rounded-full border border-white/50" aria-hidden />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:pb-20 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c5e9d7] bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-[#087f68] shadow-[0_3px_12px_rgba(28,92,70,0.04)]">
                <Sparkles size={14} />
                A more thoughtful job search
              </div>
              <h1 className="max-w-[650px] font-display text-[43px] font-semibold leading-[1.08] tracking-[-0.055em] text-[#123b35] sm:text-[56px] lg:text-[64px]">
                Make your next move{" "}
                <span className="mt-2 inline-flex rounded-[18px] bg-[#087f68] px-4 py-1.5 text-white shadow-[0_9px_24px_rgba(8,127,104,0.18)] sm:rounded-[20px]">
                  count.
                </span>
              </h1>
              <p className="mt-6 max-w-[520px] text-[15.5px] leading-7 text-[#4f7268] sm:text-[17px]">
                Find roles that fit, apply with confidence, and keep every opportunity moving forward — all in one place.
              </p>

              <form
                onSubmit={handleSearch}
                className="mt-9 grid gap-2 rounded-2xl border border-white/80 bg-white p-2.5 shadow-[0_18px_50px_rgba(22,91,67,0.12)] sm:grid-cols-[1fr_0.85fr_auto] sm:items-center"
                role="search"
              >
                <label className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 focus-within:bg-[#f6fbf8]">
                  <Search size={18} className="shrink-0 text-[#159878]" />
                  <span className="sr-only">Job title, keyword, or company</span>
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Job title, keyword, or company"
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#123b35] outline-none placeholder:text-[#8ba49b]"
                  />
                </label>
                <label className="flex min-w-0 items-center gap-3 border-t border-[#edf3f0] px-3 py-2.5 focus-within:bg-[#f6fbf8] sm:border-l sm:border-t-0">
                  <MapPin size={18} className="shrink-0 text-[#159878]" />
                  <span className="sr-only">Location</span>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="City or remote"
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#123b35] outline-none placeholder:text-[#8ba49b]"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#087f68] px-5 text-[13.5px] font-semibold text-white transition hover:bg-[#066b58] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087f68]"
                >
                  <Search size={16} />
                  Search jobs
                </button>
              </form>
              <p className="mt-3 pl-1 text-[12px] text-[#668078]">
                Explore opportunities from teams looking for their next great hire.
              </p>
            </div>

            <div className="relative mx-auto flex min-h-[370px] w-full max-w-[500px] items-center justify-center lg:min-h-[440px]">
              <div className="absolute left-[8%] top-[6%] h-[310px] w-[310px] rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.86),rgba(125,211,173,0.48))] shadow-[inset_-16px_-20px_44px_rgba(36,141,101,0.08)] sm:h-[360px] sm:w-[360px]" aria-hidden />
              <div className="absolute right-[7%] top-[20%] h-16 w-16 rounded-[22px] border border-white/70 bg-white/30 backdrop-blur-sm rotate-12" aria-hidden />
              <div className="absolute bottom-[13%] left-[10%] h-10 w-10 rounded-full bg-[#70cba7]/40" aria-hidden />

              <div className="relative z-10 w-[min(100%,360px)] rounded-[26px] border border-white/90 bg-white/90 p-5 shadow-[0_24px_60px_rgba(20,84,63,0.16)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80a095]">Your next chapter</p>
                    <p className="mt-1 font-display text-[18px] font-semibold text-[#123b35]">A search that moves with you</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f7ef] text-[#087f68]">
                    <BriefcaseBusiness size={19} />
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-[#e8f1ec] bg-[#fbfefc] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9f2e5] text-[#087f68]">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#23483e]">Your application</p>
                      <p className="mt-0.5 text-[11.5px] text-[#809a90]">Keep every detail in view</p>
                    </div>
                    <span className="ml-auto rounded-full bg-[#e8f7ef] px-2.5 py-1 text-[10.5px] font-semibold text-[#087f68]">In progress</span>
                  </div>
                  <div className="mt-5 flex items-center">
                    {[0, 1, 2, 3].map((step, index) => (
                      <div key={step} className="flex flex-1 items-center last:flex-none">
                        <span className={`grid h-7 w-7 place-items-center rounded-full ${index < 2 ? "bg-[#087f68] text-white" : "border border-[#d8e8e0] bg-white text-[#9ab1a7]"}`}>
                          {index < 2 ? <Check size={14} strokeWidth={2.7} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        {index < 3 && <span className={`h-[2px] flex-1 ${index === 0 ? "bg-[#69c49c]" : "bg-[#e4eee8]"}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex justify-between text-[9px] text-[#79948a]">
                    <span>Applied</span><span>Review</span><span>Interview</span><span>Offer</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11.5px] font-medium text-[#668078]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e8f7ef] text-[#087f68]"><Check size={12} /></span>
                  One clear place for every next step
                </div>
              </div>

              <div className="absolute -left-1 top-[4%] z-20 hidden items-center gap-2.5 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_12px_30px_rgba(20,84,63,0.12)] sm:flex sm:-left-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f7ef] text-[#087f68]"><Search size={16} /></span>
                <div>
                  <p className="text-[11px] font-semibold text-[#23483e]">Find your fit</p>
                  <p className="text-[10px] text-[#839b91]">Your next opportunity</p>
                </div>
              </div>
              <div className="absolute -right-1 bottom-[13%] z-20 hidden items-center gap-2.5 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_12px_30px_rgba(20,84,63,0.12)] sm:flex sm:-right-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f7ef] text-[#087f68]"><Check size={17} /></span>
                <div>
                  <p className="text-[11px] font-semibold text-[#23483e]">Stay in the loop</p>
                  <p className="text-[10px] text-[#839b91]">Progress, made visible</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#edf3f0] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-8 sm:flex-row sm:justify-between">
            <p className="max-w-[170px] text-center text-[11px] font-semibold uppercase leading-5 tracking-[0.13em] text-[#8aa197] sm:text-left">
              Teams hiring on ProConnect
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4 sm:justify-end sm:gap-x-11">
              {companies.length > 0 ? companies.map((company) => (
                <span key={company._id} className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.02em] text-[#628076]">
                  {company.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logo} alt="" className="h-6 w-6 rounded-md object-cover" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e8f7ef] text-[10px] font-bold text-[#087f68]">{company.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  {company.name}
                </span>
              )) : (
                <span className="text-[13px] font-medium text-[#79948a]">Discover your next team and opportunity</span>
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#f7fcf9]">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <div className="mx-auto mb-10 max-w-xl text-center md:mb-12">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#159878]">Simple by design</span>
              <h2 className="mt-3 font-display text-[30px] font-semibold tracking-[-0.04em] text-[#123b35] sm:text-[38px]">
                From searching to moving forward
              </h2>
              <p className="mt-3 text-[14.5px] leading-6 text-[#668078]">
                A calmer, clearer way to take the next step in your career.
              </p>
            </div>

            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative rounded-2xl border border-[#e7f0eb] bg-white p-5 shadow-[0_6px_22px_rgba(15,66,52,0.035)]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e8f7ef] text-[#087f68]">
                      <Icon size={19} />
                    </span>
                    <span className="font-display text-[13px] font-semibold tracking-wide text-[#a0b5ac]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-[16px] font-semibold text-[#1d453a]">{title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.7] text-[#718b81]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="featured-jobs" className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#159878]">Picked for your next step</span>
                <h2 className="mt-3 font-display text-[30px] font-semibold tracking-[-0.04em] text-[#123b35] sm:text-[38px]">
                  Featured opportunities
                </h2>
                <p className="mt-2 text-[14px] text-[#718b81]">Explore the latest roles from teams hiring now.</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#087f68] transition hover:bg-[#eff9f3]">
                View all jobs <ArrowRight size={16} />
              </Link>
            </div>

            {!jobsLoaded ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading featured jobs">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-[205px] animate-pulse rounded-2xl border border-[#e7f0eb] bg-[#f7fcf9]" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.slice(0, 3).map((job) => <JobPreviewCard key={job._id} job={job} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cfe5d9] bg-[#f7fcf9] px-6 py-10 text-center">
                <p className="font-display text-[17px] font-semibold text-[#315c51]">New opportunities are on the way</p>
                <p className="mt-2 text-[13px] text-[#718b81]">Take a look at all open roles and find a fit for your next step.</p>
                <Link href="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087f68] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#066b58]">
                  Browse jobs <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6f0eb] bg-[#f7fcf9]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[linear-gradient(140deg,#30b88e,#087f68)] font-display text-[14px] font-bold text-white">P</span>
            <span className="font-display text-[15px] font-semibold text-[#123b35]">ProConnect</span>
          </Link>
          <p className="text-[12.5px] text-[#82998f]">Make your next move count.</p>
          <div className="flex gap-5 text-[12.5px] font-medium text-[#668078]">
            <Link href="/jobs" className="transition hover:text-[#087f68]">Jobs</Link>
            <Link href="/login" className="transition hover:text-[#087f68]">Sign in</Link>
            <Link href="/register" className="transition hover:text-[#087f68]">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
