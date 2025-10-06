export type ConflictDetail = { title: string; range: string };
export type ConflictWarning = {
  hasConflict: boolean;
  message: string;
  details?: ConflictDetail[];
};

interface ConflictBannerProps {
  warning?: ConflictWarning;
}

export default function ConflictBanner({ warning }: ConflictBannerProps) {
  if (!warning || !warning.hasConflict) return null;

  const details = warning.details ?? [];

  return (
    <div role="alert" aria-live="polite" className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
      <div className="text-sm font-medium">{warning.message}</div>
      {details.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {details.map((d, idx) => (
            <li key={idx}><span className="font-medium">{d.title}</span> — {d.range}</li>
          ))}
        </ul>
      )}
    </div>
  );
}