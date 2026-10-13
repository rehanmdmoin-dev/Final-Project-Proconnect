"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";

interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: string;
  companySize?: string;
  foundedYear?: number;
  verificationStatus?: string;
}

const emptyForm = {
  name: "",
  description: "",
  industry: "",
  website: "",
  location: "",
  companySize: "1-10",
  foundedYear: "",
};

type CompanyForm = typeof emptyForm;

const toForm = (company: Company): CompanyForm => ({
  name: company.name || "",
  description: company.description || "",
  industry: company.industry || "",
  website: company.website || "",
  location: company.location || "",
  companySize: company.companySize || "1-10",
  foundedYear: company.foundedYear ? String(company.foundedYear) : "",
});

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = companies.find((company) => company._id === selectedId);

  useEffect(() => {
    let active = true;
    api.get(ep.companies.mine)
      .then(({ data }) => {
        if (!active) return;
        const mine: Company[] = data.data || [];
        setCompanies(mine);
        if (mine.length) {
          setSelectedId(mine[0]._id);
          setForm(toForm(mine[0]));
        }
      })
      .catch((requestError) => {
        if (active) setError(errText(requestError, "Could not load your companies"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const chooseCompany = (company: Company) => {
    setSelectedId(company._id);
    setForm(toForm(company));
    setError("");
  };

  const startNew = () => {
    setSelectedId("");
    setForm(emptyForm);
    setError("");
  };

  const update = (key: keyof CompanyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      industry: form.industry.trim(),
      website: form.website.trim(),
      location: form.location.trim(),
      companySize: form.companySize,
      ...(form.foundedYear ? { foundedYear: Number(form.foundedYear) } : {}),
    };

    try {
      const response = selected
        ? await api.patch(ep.companies.byId(selected._id), payload)
        : await api.post(ep.companies.list, payload);
      const saved: Company = response.data.data;
      setCompanies((current) => selected
        ? current.map((company) => company._id === saved._id ? saved : company)
        : [saved, ...current]);
      setSelectedId(saved._id);
      setForm(toForm(saved));
      toast.success(selected ? "Company profile updated" : "Company created");
    } catch (requestError) {
      setError(errText(requestError, "Could not save your company profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Company" subtitle="Manage the organizations you hire for" />
      <div className="w-full px-5 py-7 lg:px-9 full-width">
        {error && <p role="alert" className="mb-4 text-[13px] text-stage-rejected">{error}</p>}
        {loading ? (
          <p className="text-[14px] text-muted">Loading company profiles...</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[16px] text-ink">Your companies</h2>
                <Button type="button" size="sm" variant="secondary" onClick={startNew} aria-label="Add company" title="Add company">
                  <Plus size={15} />
                </Button>
              </div>
              {companies.length === 0 ? (
                <p className="text-[13px] text-muted">Add your company profile to start posting jobs.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {companies.map((company) => (
                    <li key={company._id}>
                      <button
                        type="button"
                        onClick={() => chooseCompany(company)}
                        className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3.5 py-3 text-left transition-colors ${selectedId === company._id ? "border-primary bg-primary/5" : "border-line bg-surface hover:border-primary/50"}`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-line-soft text-muted"><Building2 size={17} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">{company.name}</span>
                          <span className="block truncate text-[12px] text-muted">{company.industry || company.location || "Company profile"}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Card className="p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-line-soft pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary"><Building2 size={19} /></span>
                <div>
                  <h2 className="font-display text-[18px] text-ink">{selected ? "Company profile" : "Add a company"}</h2>
                  {selected?.verificationStatus && <p className="mt-0.5 text-[13px] capitalize text-muted">Verification: {selected.verificationStatus}</p>}
                </div>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Company name" value={form.name} onChange={(event) => update("name", event.target.value)} minLength={2} maxLength={120} required />
                  <Input label="Industry" value={form.industry} onChange={(event) => update("industry", event.target.value)} maxLength={120} placeholder="e.g. Software" />
                </div>
                <Textarea label="Description" value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={3000} placeholder="What does your company do?" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Website" type="url" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://example.com" />
                  <Input label="Location" value={form.location} onChange={(event) => update("location", event.target.value)} maxLength={160} placeholder="City or region" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Company size" value={form.companySize} onChange={(event) => update("companySize", event.target.value)}>
                    <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>501-1000</option><option>1000+</option>
                  </Select>
                  <Input label="Founded year" type="number" min="1800" max={new Date().getFullYear()} value={form.foundedYear} onChange={(event) => update("foundedYear", event.target.value)} placeholder="Optional" />
                </div>
                <div className="flex justify-end border-t border-line-soft pt-5">
                  <Button type="submit" loading={saving}>{selected ? "Save changes" : "Create company"}</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}