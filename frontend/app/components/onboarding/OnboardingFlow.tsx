"use client";

import { useState, useEffect } from "react";
import { NamingScreen } from "./NamingScreen";
import { ArchetypeScreen } from "./ArchetypeScreen";
import { QuestionScreen } from "./QuestionScreen";
import { SummaryScreen } from "./SummaryScreen";
import { QUESTIONS } from "./questions";
import { getProfile, completeOnboarding } from "@/app/lib/api";

type Stage = "loading" | "naming" | "archetype" | "questions" | "summary" | "done";

interface Props {
  children: React.ReactNode;
}

/**
 * OnboardingFlow — Orquesta las 4 etapas del onboarding de Fase 1.
 *
 * Etapas:
 *   naming    → usuario nombra al agente
 *   archetype → usuario elige arquetipo (personalidad semilla)
 *   questions → 13 preguntas: perfil usuario + protocolo de interacción
 *   summary   → resumen + confirmación
 *   done      → muestra el dashboard
 *
 * Al completar llama POST /api/onboarding/complete que:
 *   - Guarda perfil en SQLite
 *   - Planta seeds del arquetipo en Šà
 *   - Genera vault/ (AGENT-IDENTITY.md, USER-PROFILE.md, HOW-TO-TALK.md)
 */
export function OnboardingFlow({ children }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [aiName, setAiName] = useState("");
  const [archetype, setArchetype] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);

  // Detecta si el onboarding ya fue completado
  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p.phase1_complete || p.onboarding_complete) {
          const nameEntry = p.entries.find((e) => e.key === "ai_name");
          if (nameEntry) setAiName(nameEntry.value);
          setStage("done");
        } else {
          setStage("naming");
        }
      })
      .catch(() => setStage("naming"));
  }, []);

  const handleNamed = (name: string) => {
    setAiName(name);
    setStage("archetype");
  };

  const handleArchetype = (archetypeId: string) => {
    setArchetype(archetypeId);
    setStage("questions");
  };

  const handleAnswer = (answer: string) => {
    const question = QUESTIONS[questionIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      // Todas las preguntas respondidas — persistir y mostrar resumen
      persistAll(newAnswers);
      setStage("summary");
    }
  };

  const persistAll = async (allAnswers: Record<string, string>) => {
    const answerEntries = Object.entries(allAnswers).map(([key, value]) => ({
      key,
      value,
    }));
    try {
      await completeOnboarding({
        ai_name: aiName,
        archetype,
        answers: answerEntries,
      });
    } catch {
      // Silent — el dashboard funciona sin perfil persistido
    }
  };

  const handleComplete = () => setStage("done");

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <span className="text-[#8888A0] font-mono text-sm animate-pulse">
          cargando...
        </span>
      </div>
    );
  }

  if (stage === "done") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {stage === "naming" && <NamingScreen onNamed={handleNamed} />}

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
      </div>
    </div>
  );
}
