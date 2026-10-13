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
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { resendVerification, verifyEmail } from "@/redux/slice/authSlice";

const schema = yup.object({
  email: yup.string().trim().email("Enter a valid email address").required("Email is required"),
  code: yup.string().matches(/^\d{6}$/, "Enter the six-digit code").required("Code is required"),
});
type Values = yup.InferType<typeof schema>;

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Values>({
    resolver: yupResolver(schema),
    defaultValues: { email: params.get("email") || "", code: "" },
  });

  const onSubmit = async (values: Values) => {
    const result = await dispatch(verifyEmail({ email: values.email.trim(), code: values.code }));
    if (verifyEmail.fulfilled.match(result)) router.replace("/login");
  };

  const onResend = () => {
    const email = getValues("email").trim();
    if (email) dispatch(resendVerification({ email }));
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the six-digit code we sent you. It expires in 10 minutes."
      footer={<>Used another address? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email address" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          {...register("code")}
          error={errors.code?.message}
        />
        <Button type="submit" size="lg" full loading={loading}>Verify email</Button>
        <button type="button" onClick={onResend} disabled={loading}
          className="text-[13px] font-medium text-primary hover:underline disabled:opacity-50 cursor-pointer">
          Send a new code
        </button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense><VerifyEmailForm /></Suspense>;
}