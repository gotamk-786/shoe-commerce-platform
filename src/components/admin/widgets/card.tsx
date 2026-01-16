type Props = {
  title: string;
  value: string;
  helper?: string;
  tone?: "emerald" | "blue" | "indigo" | "amber";
};

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  emerald: "from-emerald-500/30 to-emerald-400/10",
  blue: "from-sky-500/30 to-sky-400/10",
  indigo: "from-indigo-500/30 to-indigo-400/10",
  amber: "from-amber-500/30 to-amber-400/10",
};

export default function Card({ title, value, helper, tone = "blue" }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <p className="text-sm text-white/70">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper && <p className="mt-1 text-xs text-white/60">{helper}</p>}
      <div className={`mt-3 h-1 w-14 rounded-full bg-gradient-to-r ${toneMap[tone]}`} />
    </div>
  );
}
