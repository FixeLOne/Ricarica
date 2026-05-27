import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const ACCENT_DOTS = new Set([4, 5, 7]);

export default function BrandMark({
  className,
  size = "sm",
  label,
}) {
  const accessibilityProps = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      {...accessibilityProps}
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        SIZE_CLASSES[size] ?? size,
        className
      )}
    >
      <span className="grid h-[72%] w-[72%] grid-cols-3 grid-rows-3 gap-[18%]">
        {Array.from({ length: 9 }).map((_, index) => {
          const active = ACCENT_DOTS.has(index);

          return (
            <span
              key={index}
              className={cn(
                "rounded-full transition-colors",
                index === 4 && "scale-[1.45]",
                index === 5 && "scale-95",
                index === 7 && "scale-75"
              )}
              style={{
                backgroundColor: active
                  ? "var(--brand-primary)"
                  : "color-mix(in srgb, var(--brand-text) 32%, transparent)",
              }}
            />
          );
        })}
      </span>
    </span>
  );
}
