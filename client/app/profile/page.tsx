"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Briefcase, GraduationCap, FileText, Pencil, Plus, MapPin, Mail, Phone, Upload, X, Trash2,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import { Input, Select, Textarea } from "@/components/ui/Field";
import api from "@/api/axios";
import { ep } from "@/api/endpoints";
import { fmtDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";

type ProfileSection = "experience" | "education" | "skill";

const emptyExperience = {
  company: "", position: "", employmentType: "Full Time", location: "",
  startDate: "", endDate: "", currentlyWorking: false, description: "",
};
const emptyEducation = {
  institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", description: "",
};
const emptySkill = { name: "", proficiency: "Intermediate" };

const dateForInput = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", headline: "", about: "", location: "", phone: "" });
  const [activeSection, setActiveSection] = useState<ProfileSection | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [educationForm, setEducationForm] = useState(emptyEducation);
  const [skillForm, setSkillForm] = useState(emptySkill);

  const load = async () => {
    try {
      const { data } = await api.get(ep.users.me);
      setProfile(data.data);
      setForm({
        name: data.data.name || "",
        headline: data.data.headline || "",
        about: data.data.about || "",
        location: data.data.location || "",
        phone: data.data.phone || "",
      });
    } catch {
      toast.error("Could not load your profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(ep.users.me, form);
      toast.success("Profile updated");
      setEditing(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save your changes");
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (file?: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("resume", file);
    try {
      await api.post(ep.users.resume, fd);
      toast.success("Resume uploaded");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not upload that file");
    }
  };

  const closeSectionEditor = () => {
    setActiveSection(null);
    setEditingEntryId(null);
  };

  const editExperience = (entry?: any) => {
    setActiveSection("experience");
    setEditingEntryId(entry?._id || null);
    setExperienceForm(entry ? {
      company: entry.company || "",
      position: entry.position || "",
      employmentType: entry.employmentType || "Full Time",
      location: entry.location || "",
      startDate: dateForInput(entry.startDate),
      endDate: dateForInput(entry.endDate),
      currentlyWorking: Boolean(entry.currentlyWorking),
      description: entry.description || "",
    } : { ...emptyExperience });
  };

  const editEducation = (entry?: any) => {
    setActiveSection("education");
    setEditingEntryId(entry?._id || null);
    setEducationForm(entry ? {
      institution: entry.institution || "",
      degree: entry.degree || "",
      fieldOfStudy: entry.fieldOfStudy || "",
      startDate: dateForInput(entry.startDate),
      endDate: dateForInput(entry.endDate),
      grade: entry.grade || "",
      description: entry.description || "",
    } : { ...emptyEducation });
  };

  const editSkill = (entry?: any) => {
    setActiveSection("skill");
    setEditingEntryId(entry?._id || null);
    setSkillForm(entry ? {
      name: entry.name || "",
      proficiency: entry.proficiency || "Intermediate",
    } : { ...emptySkill });
  };

  const saveExperience = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSectionSaving(true);
    const payload = {
      ...experienceForm,
      endDate: experienceForm.currentlyWorking || !experienceForm.endDate ? null : experienceForm.endDate,
    };
    try {
      if (editingEntryId) {
        await api.patch(ep.users.experienceId(editingEntryId), payload);
      } else {
        await api.post(ep.users.experience, payload);
      }
      toast.success(editingEntryId ? "Experience updated" : "Experience added");
      closeSectionEditor();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save this experience");
    } finally {
      setSectionSaving(false);
    }
  };

  const saveEducation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSectionSaving(true);
    const payload = {
      institution: educationForm.institution,
      degree: educationForm.degree,
      fieldOfStudy: educationForm.fieldOfStudy,
      grade: educationForm.grade,
      description: educationForm.description,
      ...(educationForm.startDate ? { startDate: educationForm.startDate } : {}),
      ...(educationForm.endDate ? { endDate: educationForm.endDate } : {}),
    };
    try {
      if (editingEntryId) {
        await api.patch(ep.users.educationId(editingEntryId), payload);
      } else {
        await api.post(ep.users.education, payload);
      }
      toast.success(editingEntryId ? "Education updated" : "Education added");
      closeSectionEditor();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save this education");
    } finally {
      setSectionSaving(false);
    }
  };

  const saveSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSectionSaving(true);
    try {
      if (editingEntryId) {
        await api.patch(ep.users.skillId(editingEntryId), skillForm);
      } else {
        await api.post(ep.users.skills, skillForm);
      }
      toast.success(editingEntryId ? "Skill updated" : "Skill added");
      closeSectionEditor();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save this skill");
    } finally {
      setSectionSaving(false);
    }
  };

  const removeEntry = async (section: ProfileSection, id: string) => {
    if (!window.confirm("Remove this item from your profile?")) return;
    const endpoint = section === "experience"
      ? ep.users.experienceId(id)
      : section === "education"
        ? ep.users.educationId(id)
        : ep.users.skillId(id);
    try {
      await api.delete(endpoint);
      toast.success("Profile item removed");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not remove this item");
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Your profile" />
        <div className="w-full px-5 lg:px-9 py-7 flex flex-col gap-4">
          <Skeleton className="h-44" /><Skeleton className="h-52" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Your profile"
        subtitle="This is what recruiters see when you apply"
        action={
          !editing ? (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={save} loading={saving}>Save changes</Button>
            </div>
          )
        }
      />

      <div className="w-full px-5 lg:px-9 py-7 flex flex-col gap-5">
        <Card className="overflow-hidden">
          <div className="h-24 bg-[linear-gradient(110deg,var(--color-primary),var(--color-violet))]" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-5">
              <div className="ring-4 ring-surface rounded-full">
                <Avatar name={profile?.name || "?"} src={profile?.profileImage} size="lg" />
              </div>
              {!editing && (
                <div className="pb-1 min-w-0">
                  <h2 className="font-display text-[22px] text-ink truncate">{profile?.name}</h2>
                  <p className="text-[14px] text-muted truncate">{profile?.headline || "Add a headline to introduce yourself"}</p>
                </div>
              )}
            </div>

            {editing ? (
              <div className="flex flex-col gap-4">
                <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Headline" placeholder="Backend Developer | Node.js, MongoDB"
                  value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                <Textarea label="About" placeholder="A short summary of what you do and what you're looking for."
                  value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Location" placeholder="Kolkata, India"
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  <Input label="Phone" placeholder="9876543210"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted mb-5">
                  {profile?.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>}
                  {profile?.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>}
                  {profile?.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {profile.phone}</span>}
                </div>
                {profile?.about && (
                  <p className="text-[14.5px] leading-relaxed text-muted whitespace-pre-line">{profile.about}</p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Resume */}
        <Card className="p-6">
          <h3 className="font-display text-[16px] text-ink mb-4">Resume</h3>
          {profile?.resume?.url ? (
            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line p-4">
              <span className="grid place-items-center h-10 w-10 rounded-[var(--radius-sm)] bg-primary-soft text-primary shrink-0">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-ink truncate">{profile.resume.originalName || "resume.pdf"}</p>
                <p className="text-[12px] text-muted">Uploaded {fmtDate(profile.resume.uploadedAt)}</p>
              </div>
              <a href={profile.resume.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">View</Button>
              </a>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={(e) => uploadResume(e.target.files?.[0])} />
                <span className="inline-flex items-center h-8 px-3 rounded-[var(--radius-sm)] text-[13px] text-muted hover:text-ink hover:bg-line-soft transition-colors">
                  Replace
                </span>
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-line py-10 cursor-pointer hover:border-primary hover:bg-primary-soft/25 transition-colors">
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={(e) => uploadResume(e.target.files?.[0])} />
              <Upload size={22} className="text-muted-2" />
              <span className="text-[14px] font-medium text-ink">Upload your resume</span>
              <span className="text-[12.5px] text-muted">PDF or Word, up to 5MB — required before you can apply</span>
            </label>
          )}
        </Card>

        {/* Experience */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[16px] text-ink">Experience</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => editExperience()}><Plus size={14} /> Add</Button>
          </div>
          {activeSection === "experience" && (
            <form onSubmit={saveExperience} className="mb-5 flex flex-col gap-4 rounded-[var(--radius-sm)] border border-line p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Position" value={experienceForm.position} onChange={(e) => setExperienceForm({ ...experienceForm, position: e.target.value })} required maxLength={120} />
                <Input label="Company" value={experienceForm.company} onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })} required maxLength={120} />
                <Select label="Employment type" value={experienceForm.employmentType} onChange={(e) => setExperienceForm({ ...experienceForm, employmentType: e.target.value })}>
                  <option>Full Time</option><option>Part Time</option><option>Internship</option><option>Contract</option><option>Freelance</option>
                </Select>
                <Input label="Location" value={experienceForm.location} onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })} maxLength={120} />
                <Input label="Start date" type="date" value={experienceForm.startDate} onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })} required />
                {!experienceForm.currentlyWorking && (
                  <Input label="End date" type="date" min={experienceForm.startDate} value={experienceForm.endDate} onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })} />
                )}
              </div>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <input type="checkbox" checked={experienceForm.currentlyWorking} onChange={(e) => setExperienceForm({ ...experienceForm, currentlyWorking: e.target.checked })} />
                I currently work here
              </label>
              <Textarea label="Description" value={experienceForm.description} onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })} maxLength={1000} />
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={closeSectionEditor}>Cancel</Button>
                <Button type="submit" size="sm" loading={sectionSaving}>Save experience</Button>
              </div>
            </form>
          )}
          {!profile?.experience?.length ? (
            <p className="text-[13.5px] text-muted">Add the roles you've held so recruiters can see your background.</p>
          ) : (
            <ol className="flex flex-col gap-5">
              {profile.experience.map((x: any) => (
                <li key={x._id} className="flex gap-3.5">
                  <span className="grid place-items-center h-10 w-10 rounded-[var(--radius-sm)] bg-line-soft text-muted shrink-0">
                    <Briefcase size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-ink">{x.position}</p>
                    <p className="text-[13px] text-muted">{x.company} · {x.employmentType}</p>
                    <p className="text-[12.5px] text-muted-2 num">
                      {fmtDate(x.startDate)} — {x.currentlyWorking ? "Present" : fmtDate(x.endDate)}
                    </p>
                    {x.description && <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed">{x.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => editExperience(x)} aria-label="Edit experience"><Pencil size={14} /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeEntry("experience", x._id)} aria-label="Remove experience"><Trash2 size={14} /></Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Education */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[16px] text-ink">Education</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => editEducation()}><Plus size={14} /> Add</Button>
          </div>
          {activeSection === "education" && (
            <form onSubmit={saveEducation} className="mb-5 flex flex-col gap-4 rounded-[var(--radius-sm)] border border-line p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Institution" value={educationForm.institution} onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })} required maxLength={160} />
                <Input label="Degree" value={educationForm.degree} onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })} required maxLength={120} />
                <Input label="Field of study" value={educationForm.fieldOfStudy} onChange={(e) => setEducationForm({ ...educationForm, fieldOfStudy: e.target.value })} maxLength={120} />
                <Input label="Grade" value={educationForm.grade} onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })} maxLength={80} />
                <Input label="Start date" type="date" value={educationForm.startDate} onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })} />
                <Input label="End date" type="date" min={educationForm.startDate} value={educationForm.endDate} onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })} />
              </div>
              <Textarea label="Description" value={educationForm.description} onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })} maxLength={1000} />
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={closeSectionEditor}>Cancel</Button>
                <Button type="submit" size="sm" loading={sectionSaving}>Save education</Button>
              </div>
            </form>
          )}
          {!profile?.education?.length ? (
            <p className="text-[13.5px] text-muted">Add your qualifications.</p>
          ) : (
            <ol className="flex flex-col gap-5">
              {profile.education.map((x: any) => (
                <li key={x._id} className="flex gap-3.5">
                  <span className="grid place-items-center h-10 w-10 rounded-[var(--radius-sm)] bg-line-soft text-muted shrink-0">
                    <GraduationCap size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-ink">{x.degree}</p>
                    <p className="text-[13px] text-muted">{x.institution}{x.fieldOfStudy ? ` · ${x.fieldOfStudy}` : ""}</p>
                    <p className="text-[12.5px] text-muted-2 num">{fmtDate(x.startDate)} — {fmtDate(x.endDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => editEducation(x)} aria-label="Edit education"><Pencil size={14} /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeEntry("education", x._id)} aria-label="Remove education"><Trash2 size={14} /></Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Skills */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[16px] text-ink">Skills</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => editSkill()}><Plus size={14} /> Add</Button>
          </div>
          {activeSection === "skill" && (
            <form onSubmit={saveSkill} className="mb-5 flex flex-col gap-4 rounded-[var(--radius-sm)] border border-line p-4 sm:flex-row sm:items-end">
              <Input label="Skill" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} required maxLength={80} />
              <Select label="Proficiency" value={skillForm.proficiency} onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option>
              </Select>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={closeSectionEditor}>Cancel</Button>
                <Button type="submit" size="sm" loading={sectionSaving}>Save skill</Button>
              </div>
            </form>
          )}
          {!profile?.skills?.length ? (
            <p className="text-[13.5px] text-muted">Skills help you show up in recruiter searches.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: any) => (
                <span key={s._id} className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-primary-soft py-1 pl-3 pr-1.5 text-[13px] font-medium text-primary">
                  {s.name}
                  <span className="ml-1 text-primary/60 font-normal">{s.proficiency}</span>
                  <button type="button" onClick={() => editSkill(s)} className="ml-1 rounded p-1 text-primary/70 hover:bg-primary/10 hover:text-primary" aria-label={`Edit ${s.name}`}><Pencil size={12} /></button>
                  <button type="button" onClick={() => removeEntry("skill", s._id)} className="rounded p-1 text-primary/70 hover:bg-primary/10 hover:text-primary" aria-label={`Remove ${s.name}`}><X size={13} /></button>
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
