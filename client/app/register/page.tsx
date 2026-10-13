"use client";
import { Suspense, useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, UserSearch } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { register as registerUser, Role } from "@/redux/slice/authSlice";
import { cn } from "@/lib/utils";

const schema = yup.object({
  name: yup.string().trim().min(2, "Use at least 2 characters").required("Name is required"),
  email: yup.string().trim().email("Enter a valid email address").required("Email is required"),
  password: yup.string().min(8, "Use at least 8 characters")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Include an uppercase letter, a lowercase letter and a number")
    .required("Password is required"),
});
type V = yup.InferType<typeof schema>;

const roles = [
  { key: "jobseeker" as Role, icon: UserSearch, title: "I'm looking for work", body: "Search roles and track applications" },
  { key: "recruiter" as Role, icon: Briefcase, title: "I'm hiring", body: "Post jobs and review candidates" },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const [role, setRole] = useState<Role>(params.get("role") === "recruiter" ? "recruiter" : "jobseeker");
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: yupResolver(schema) });

  const onSubmit = async (v: V) => {
    const res = await dispatch(registerUser({ ...v, role }));
    if (registerUser.fulfilled.match(res)) router.push(`/verify-email?email=${encodeURIComponent(v.email.trim().toLowerCase())}`);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Takes about a minute."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          {roles.map(({ key, icon: Icon, title, body }) => (
            <button key={key} type="button" onClick={() => setRole(key)}
              aria-pressed={role === key}
              className={cn(
                "text-left rounded-[var(--radius-sm)] border p-3 transition-all cursor-pointer",
                role === key ? "border-primary bg-primary-soft/50 ring-4 ring-primary/10" : "border-line bg-surface hover:border-muted-2"
              )}>
              <Icon size={17} className={cn("mb-2", role === key ? "text-primary" : "text-muted-2")} />
              <p className="text-[13px] font-medium text-ink leading-snug">{title}</p>
              <p className="text-[11.5px] text-muted mt-0.5 leading-snug">{body}</p>
            </button>
          ))}
        </div>

        <Input label="Full name" placeholder="Aarav Mehta" autoComplete="name" {...register("name")} error={errors.name?.message} />
        <Input label="Email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <Input label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password"
          {...register("password")} error={errors.password?.message}
          hint="Needs an uppercase letter, a lowercase letter and a number." />

        <Button type="submit" size="lg" full loading={loading} className="mt-1">Create account</Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense><RegisterForm /></Suspense>;
}
