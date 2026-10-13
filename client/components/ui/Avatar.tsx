import { cn, initials } from "@/lib/utils";

const sizes = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-[11px]", md: "h-11 w-11 text-[13px]", lg: "h-20 w-20 text-[22px]" };

export default function Avatar({
  name, src, size = "sm", className,
}: { name: string; src?: string; size?: keyof typeof sizes; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(sizes[size], "rounded-full object-cover border border-line shrink-0", className)} />;
  }
  return (
    <span className={cn(
      sizes[size],
      "shrink-0 rounded-full grid place-items-center font-semibold text-white bg-[linear-gradient(135deg,var(--color-primary),var(--color-violet))]",
      className
    )}>
      {initials(name)}
    </span>
  );
}
