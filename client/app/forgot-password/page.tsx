"use client";
import { useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useAppDispatch } from "@/lib/hooks";
import { forgotPassword } from "@/redux/slice/authSlice";

const schema = yup.object({ email: yup.string().trim().email("Enter a valid email address").required("Email is required") });
type V = yup.InferType<typeof schema>;

export default function Page() {
  const dispatch = useAppDispatch();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<V>({ resolver: yupResolver(schema) });

  const onSubmit = async (v: V) => {
    setBusy(true);
    await dispatch(forgotPassword(v));
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-[var(--radius-md)] border border-stage-selected/25 bg-stage-selected-soft p-5 rise">
          <MailCheck size={20} className="text-stage-selected mb-3" />
          <p className="text-[14px] text-ink mb-1">Check {getValues("email")}</p>
          <p className="text-[13px] text-muted leading-relaxed">
            If an account exists for that address, the link is on its way. It expires in 15 minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
          <Button type="submit" size="lg" full loading={busy}>Email me a reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
