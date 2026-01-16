import { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "light" | "dark";
}) {
  const eyebrowClass =
    tone === "dark" ? "text-white/70 border-white/20 bg-white/10" : "text-gray-600";
  const titleClass = tone === "dark" ? "text-white" : "text-gray-900";
  const descriptionClass = tone === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <span className={`pill inline-block text-[13px] ${eyebrowClass}`}>{eyebrow}</span>
        )}
        <div>
          <h2 className={`text-2xl font-semibold tracking-tight md:text-3xl ${titleClass}`}>
            {title}
          </h2>
          {description && (
            <p className={`mt-2 max-w-2xl text-sm ${descriptionClass}`}>{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
