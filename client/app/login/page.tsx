"use client";
import { Suspense } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login } from "@/redux/slice/authSlice";

const schema = yup.object({
  email: yup.string().trim().email("Enter a valid email address").required("Email is required"),
  password: yup.string().required("Password is required"),
});
type V = yup.InferType<typeof schema>;

function LoginForm() {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: yupResolver(schema) });

  const onSubmit = async (v: V) => {
    const res = await dispatch(login(v));
    if (login.fulfilled.match(res)) {
      window.location.assign("/dashboard");
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Pick up where you left off."
      footer={<>New here? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <div>
          <Input label="Password" type="password" placeholder="Your password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[13px] text-primary hover:underline">Forgot your password?</Link>
          </div>
        </div>
        <Button type="submit" size="lg" full loading={loading} className="mt-1">Sign in</Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense><LoginForm /></Suspense>;
}
