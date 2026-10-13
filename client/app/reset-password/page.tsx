"use client";
import { Suspense } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useAppDispatch } from "@/lib/hooks";
import { resetPassword } from "@/redux/slice/authSlice";

const schema = yup.object({
  password: yup.string().min(8, "Use at least 8 characters")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Include an uppercase letter, a lowercase letter and a number")
    .required("Choose a new password"),
  confirm: yup.string().oneOf([yup.ref("password")], "Passwords don't match").required("Confirm your password"),
});
type V = yup.InferType<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const dispatch = useAppDispatch();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<V>({ resolver: yupResolver(schema) });

  const onSubmit = async (v: V) => {
    const res = await dispatch(resetPassword({ token, password: v.password }));
    if (resetPassword.fulfilled.match(res)) router.push("/login");
  };

  if (!token) {
    return (
      <AuthShell title="Link not valid" subtitle="This reset link is missing its token."
        footer={<Link href="/forgot-password" className="font-medium text-primary hover:underline">Request a new link</Link>}>
        <p className="text-[13.5px] text-muted leading-relaxed">
          Open the link directly from your email, or request a fresh one — links expire 15 minutes after they're sent.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="This signs you out on other devices."
      footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="New password" type="password" placeholder="At least 8 characters" {...register("password")} error={errors.password?.message} />
        <Input label="Confirm new password" type="password" placeholder="Type it again" {...register("confirm")} error={errors.confirm?.message} />
        <Button type="submit" size="lg" full loading={isSubmitting}>Update password</Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense><ResetForm /></Suspense>;
}
