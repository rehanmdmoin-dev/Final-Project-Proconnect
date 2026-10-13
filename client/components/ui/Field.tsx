"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-[var(--radius-sm)] border bg-surface text-[14.5px] text-ink placeholder:text-muted-2 transition-all duration-150 border-line focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none";

const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink mb-1.5 block">{children}</label>
);
const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-stage-rejected mt-1.5">{msg}</p> : null;

interface In extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; }
export const Input = forwardRef<HTMLInputElement, In>(
  ({ label, error, hint, className, type, id, ...p }, ref) => {
    const [show, setShow] = useState(false);
    const isPw = type === "password";
    const fid = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div>
        {label && <Label htmlFor={fid}>{label}</Label>}
        <div className="relative">
          <input
            id={fid} ref={ref} type={isPw ? (show ? "text" : "password") : type}
            className={cn(base, "h-11 px-3.5", isPw && "pr-11", error && "border-stage-rejected focus:border-stage-rejected focus:ring-stage-rejected/10", className)}
            {...p}
          />
          {isPw && (
            <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-muted"
              aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        <Err msg={error} />
        {!error && hint && <p className="text-xs text-muted-2 mt-1.5">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface Ta extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, Ta>(
  ({ label, error, className, id, ...p }, ref) => {
    const fid = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div>
        {label && <Label htmlFor={fid}>{label}</Label>}
        <textarea id={fid} ref={ref}
          className={cn(base, "min-h-[110px] px-3.5 py-3 resize-y", error && "border-stage-rejected", className)} {...p} />
        <Err msg={error} />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface Se extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; }
export const Select = forwardRef<HTMLSelectElement, Se>(
  ({ label, error, className, id, children, ...p }, ref) => {
    const fid = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div>
        {label && <Label htmlFor={fid}>{label}</Label>}
        <select id={fid} ref={ref} className={cn(base, "h-11 px-3 cursor-pointer", className)} {...p}>
          {children}
        </select>
        <Err msg={error} />
      </div>
    );
  }
);
Select.displayName = "Select";
