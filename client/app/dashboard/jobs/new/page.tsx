"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";
import { useAppDispatch } from "@/lib/hooks";
import { createJob } from "@/redux/slice/jobSlice";

interface CompanyOption {
  _id: string;
  name: string;
}

const initialForm = {
  company: "",
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  skills: "",
  location: "",
  workMode: "On-site",
  jobType: "Full Time",
  experienceMin: "0",
  experienceMax: "0",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
  status: "active",
};

const splitLines = (value: string) => value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(ep.companies.mine)
      .then(({ data }) => {
        if (!active) return;
        const available = data.data || [];
        setCompanies(available);
        setForm((current) => ({ ...current, company: current.company || available[0]?._id || "" }));
      })
      .catch((error) => {
        if (active) setCompanyError(errText(error, "Could not load your companies"));
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await dispatch(createJob({
        company: form.company,
        title: form.title.trim(),
        description: form.description.trim(),
        responsibilities: splitLines(form.responsibilities),
        requirements: splitLines(form.requirements),
        skills: splitLines(form.skills),
        location: form.location.trim(),
        workMode: form.workMode,
        jobType: form.jobType,
        experience: { min: Number(form.experienceMin), max: Number(form.experienceMax) },
        salary: {
          ...(form.salaryMin ? { min: Number(form.salaryMin) } : {}),
          ...(form.salaryMax ? { max: Number(form.salaryMax) } : {}),
          currency: "INR",
          isDisclosed: true,
        },
        ...(form.deadline ? { deadline: form.deadline } : {}),
        status: form.status,
      })).unwrap();
      router.push("/dashboard");
    } catch {
      // The createJob thunk reports API failures through the app's toast flow.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Post a job" subtitle="Create an opening for your team" />
      <div className="w-full px-5 py-7 lg:px-9 full-width">
        <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <Card className="p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-line-soft pb-5">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <BriefcaseBusiness size={19} />
            </span>
            <div>
              <h2 className="font-display text-[18px] text-ink">Job details</h2>
              <p className="mt-0.5 text-[13px] text-muted">Fields marked required must be completed.</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Company" value={form.company} onChange={(event) => update("company", event.target.value)} required disabled={companiesLoading || companies.length === 0}>
                <option value="">{companiesLoading ? "Loading companies..." : "Choose a company"}</option>
                {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
              </Select>
              <Input label="Job title" value={form.title} onChange={(event) => update("title", event.target.value)} minLength={3} maxLength={140} required placeholder="e.g. Product Designer" />
            </div>
            {companyError && <p role="alert" className="-mt-3 text-[13px] text-stage-rejected">{companyError}</p>}
            {!companiesLoading && !companyError && companies.length === 0 && <p className="-mt-3 text-[13px] text-muted">No company is available for your account yet.</p>}

            <Textarea label="Description" value={form.description} onChange={(event) => update("description", event.target.value)} minLength={20} required placeholder="Describe the role and what the successful candidate will do." />

            <div className="grid gap-4 sm:grid-cols-2">
              <Textarea label="Responsibilities" value={form.responsibilities} onChange={(event) => update("responsibilities", event.target.value)} placeholder="One item per line or separated by commas" />
              <Textarea label="Requirements" value={form.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder="One item per line or separated by commas" />
            </div>

            <Input label="Skills" value={form.skills} onChange={(event) => update("skills", event.target.value)} placeholder="React, TypeScript, UX research" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Location" value={form.location} onChange={(event) => update("location", event.target.value)} maxLength={160} placeholder="City or region" />
              <Select label="Work mode" value={form.workMode} onChange={(event) => update("workMode", event.target.value)}>
                <option>On-site</option><option>Hybrid</option><option>Remote</option>
              </Select>
              <Select label="Job type" value={form.jobType} onChange={(event) => update("jobType", event.target.value)}>
                <option>Full Time</option><option>Part Time</option><option>Internship</option><option>Contract</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Minimum years" type="number" min="0" value={form.experienceMin} onChange={(event) => update("experienceMin", event.target.value)} />
                <Input label="Maximum years" type="number" min="0" value={form.experienceMax} onChange={(event) => update("experienceMax", event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Minimum salary (INR)" type="number" min="0" value={form.salaryMin} onChange={(event) => update("salaryMin", event.target.value)} placeholder="Optional" />
                <Input label="Maximum salary (INR)" type="number" min="0" value={form.salaryMax} onChange={(event) => update("salaryMax", event.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Application deadline" type="date" min={new Date().toISOString().slice(0, 10)} value={form.deadline} onChange={(event) => update("deadline", event.target.value)} />
              <Select label="Listing status" value={form.status} onChange={(event) => update("status", event.target.value)}>
                <option value="active">Publish now</option><option value="draft">Save as draft</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
              <Link href="/dashboard"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" loading={submitting} disabled={companiesLoading || companies.length === 0}>
                {form.status === "draft" ? "Save draft" : "Publish job"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}