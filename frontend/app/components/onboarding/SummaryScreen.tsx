"use client";

interface Props {
  aiName: string;
  answers: Record<string, string>;
  onComplete: () => void;
}

/**
 * SummaryScreen — final onboarding screen.
 * Shows the AI name and 3-line summary of what the system understood.
 * User clicks to enter the dashboard.
 */
export function SummaryScreen({ aiName, answers, onComplete }: Props) {
  const work = answers["work"] ?? "";
  const goal = answers["goal_3m"] ?? "";
  const helpType = answers["help_type"] ?? "";

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg">
      <div className="flex flex-col gap-2">
        <span className="text-[#6C63FF] text-xs font-mono uppercase tracking-widest">
          Listo
        </span>
        <h2 className="text-white text-2xl font-medium">
          {aiName} está listo.
        </h2>
      </div>

      <div className="bg-[#0D0D14] border border-white/5 rounded-lg p-5 flex flex-col gap-3">
        <p className="text-[#8888A0] text-xs font-mono uppercase tracking-widest">
          Lo que {aiName} entendió
        </p>
        {work && (
          <p className="text-white text-sm">
            <span className="text-[#8888A0]">Trabajo actual: </span>
            {work}
          </p>
        )}
        {goal && (
          <p className="text-white text-sm">
            <span className="text-[#8888A0]">Meta en 3 meses: </span>
            {goal}
          </p>
        )}
        {helpType && (
          <p className="text-white text-sm">
            <span className="text-[#8888A0]">Tipo de ayuda preferida: </span>
            {helpType}
          </p>
        )}
      </div>

      <p className="text-[#8888A0] text-sm">
        {aiName} usará este perfil en cada conversación. No tendrás que volver a explicar quién eres.
      </p>

      <button
        onClick={onComplete}
        className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white font-mono py-3 px-6 rounded-lg transition-colors self-start"
      >
        Entrar →
      </button>
    </div>
  );
}
