"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NamingScreen } from "./NamingScreen";
import { ArchetypeScreen } from "./ArchetypeScreen";
import { QuestionScreen } from "./QuestionScreen";
import { SummaryScreen } from "./SummaryScreen";
import { AwaitingOpencode } from "./AwaitingOpencode";
import { QUESTIONS } from "./questions";
import { getProfile, completeOnboarding } from "@/app/lib/api";
import { useSphere } from "@/app/context/SphereContext";

const MusicPlayer = dynamic(
  () => import("@/app/components/sphere/MusicPlayer").then((m) => m.MusicPlayer),
  { ssr: false }
);

type Stage = "loading" | "naming" | "archetype" | "questions" | "summary" | "awaiting" | "done";

interface Props {
  children: React.ReactNode;
}

// Color y opacidad del glow ambiente según estado de la esfera (invisible)
const GLOW_BY_STATE: Record<string, { color: string; opacity: number }> = {
  dormant:     { color: "#a855f7", opacity: 0.0  },
  awakening:   { color: "#a855f7", opacity: 0.06 },
  listening:   { color: "#a855f7", opacity: 0.09 },
  thinking:    { color: "#a855f7", opacity: 0.18 },
  growing:     { color: "#00d4ff", opacity: 0.14 },
  remembering: { color: "#00d4ff", opacity: 0.10 },
  born:        { color: "#ffffff", opacity: 0.0  }, // la esfera ya es visible
  alive:       { color: "#a855f7", opacity: 0.0  },
  awaiting:    { color: "#a855f7", opacity: 0.0  },
  memory_saved:{ color: "#00d4ff", opacity: 0.0  },
};

export function OnboardingFlow({ children }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [aiName, setAiName] = useState("");
  const [archetype, setArchetype] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { setSphereState, setSphereVisible, state } = useSphere();

  useEffect(() => {
    // Deps vacías — solo al montar. setSphereState no va en deps porque
    // cambia referencia con cada growthLevel, lo que reactivaría esta
    // verificación mid-onboarding y volvería a "naming".
    getProfile()
      .then((p) => {
        if (p.phase1_complete || p.onboarding_complete) {
          const nameEntry = p.entries.find((e: { key: string }) => e.key === "ai_name");
          if (nameEntry) setAiName(nameEntry.value);
          setSphereVisible(true);
          setSphereState("alive");
          setStage("done");
        } else {
          setSphereVisible(false);
          setSphereState("dormant");
          setStage("naming");
        }
      })
      .catch(() => {
        setSphereVisible(false);
        setSphereState("dormant");
        setStage("naming");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transition = (next: () => void) => {
    setTransitioning(true);
    setTimeout(() => {
      next();
      setTransitioning(false);
    }, 350);
  };

  const handleNamed = (name: string) => {
    setAiName(name);
    // La esfera permanece OCULTA — solo cambia estado interno para ir
    // acumulando energía. Se revelará dramáticamente en el SummaryScreen.
    setSphereState("awakening");
    transition(() => setStage("archetype"));
  };

  const handleArchetype = (archetypeId: string) => {
    setArchetype(archetypeId);
    transition(() => setStage("questions"));
  };

  const handleAnswer = (answer: string) => {
    const question = QUESTIONS[questionIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      transition(() => setQuestionIndex((i) => i + 1));
    } else {
      persistAll(newAnswers);
      transition(() => setStage("summary"));
    }
  };

  const persistAll = async (allAnswers: Record<string, string>) => {
    const answerEntries = Object.entries(allAnswers).map(([key, value]) => ({ key, value }));
    try {
      await completeOnboarding({ ai_name: aiName, archetype, answers: answerEntries });
    } catch {}
  };

  const handleComplete = () => {
    // SummaryScreen → pantalla puente (segundo onboarding con opencode)
    setStage("awaiting");
  };

  const handleEnterSystem = () => {
    setSphereVisible(true);
    setSphereState("alive");
    setStage("done");
  };

  if (stage === "done") return <>{children}</>;

  // Glow ambiente: feedback visual del estado de la esfera mientras está oculta
  const glow = GLOW_BY_STATE[state] ?? { color: "#a855f7", opacity: 0 };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Canvas de la esfera — siempre presente, opacity controlada por sphereVisible */}
      <MusicPlayer />

      {/* Ambient glow — reacciona al estado interno de la esfera (oculta) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 55%, ${glow.color}18 0%, transparent 70%)`,
          opacity: glow.opacity > 0 ? 1 : 0,
        }}
      />

      {/* Flash de transición entre pasos */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-150 ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "radial-gradient(ellipse at center, #a855f722 0%, transparent 70%)" }}
      />

      {/* Loading */}
      {stage === "loading" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <span className="font-mono text-xs text-[#71717a] animate-pulse tracking-widest">
            inicializando šà 𒊮
          </span>
        </div>
      )}

      {/* Contenido del onboarding */}
      {stage !== "loading" && (
        <div
          className={`absolute inset-0 z-30 transition-opacity duration-200 ${
            transitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Naming — pantalla completa, esfera aún oculta */}
          {stage === "naming" && (
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <div className="w-full max-w-sm">
                <NamingScreen onNamed={handleNamed} />
              </div>
            </div>
          )}

          {/* Archetype / Questions / Summary / Awaiting — esfera visible en summary+awaiting */}
          {(stage === "archetype" || stage === "questions" || stage === "summary" || stage === "awaiting") && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 pt-20 pb-8">
              {stage === "archetype" && (
                <ArchetypeScreen aiName={aiName} onChosen={handleArchetype} />
              )}
              {stage === "questions" && (
                <QuestionScreen
                  question={QUESTIONS[questionIndex]}
                  questionNumber={questionIndex + 1}
                  total={QUESTIONS.length}
                  onAnswer={handleAnswer}
                />
              )}
              {stage === "summary" && (
                <SummaryScreen
                  aiName={aiName}
                  answers={{ ...answers, archetype }}
                  onComplete={handleComplete}
                />
              )}
              {stage === "awaiting" && (
                <AwaitingOpencode
                  aiName={aiName}
                  onEnter={handleEnterSystem}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
