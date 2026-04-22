"use client";

import { useState, useEffect, useRef } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";
import { useSphere } from "@/app/context/SphereContext";
import { type Question } from "./questions";

interface Props {
  question: Question;
  questionNumber: number;
  total: number;
  onAnswer: (answer: string) => void;
}

export function QuestionScreen({ question, questionNumber, total, onAnswer }: Props) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [questionReady, setQuestionReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setSphereState, incrementGrowth } = useSphere();

  useEffect(() => {
    setQuestionReady(false);
    setText("");
    setSelected([]);
  }, [question]);

  useEffect(() => {
    setSphereState("listening");
  }, [question, setSphereState]);

  useEffect(() => {
    if (questionReady && question.type === "text") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [questionReady, question.type]);

  const canContinue =
    question.type === "text"
      ? text.trim().length > 0
      : selected.length > 0 || (question.withText && text.trim().length > 0);

  const handleContinue = () => {
    if (!canContinue) return;
    let answer = "";
    if (question.type === "text") {
      answer = text.trim();
    } else if (question.type === "select") {
      answer = selected[0] ?? text.trim();
    } else {
      const parts = [...selected];
      if (question.withText && text.trim()) parts.push(text.trim());
      answer = parts.join(", ");
    }
    setSphereState("thinking");
    incrementGrowth();
    onAnswer(answer);
  };

  const toggleOption = (opt: string) => {
    if (question.type === "select") {
      setSelected([opt]);
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
      );
    }
  };

  // Puntos de progreso
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className="flex flex-col gap-6 w-full max-w-sm animate-fade-in rounded-sm px-7 py-8"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {dots.map((i) => (
          <span
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              i < questionNumber - 1
                ? "bg-[#00d4ff]"
                : i === questionNumber - 1
                ? "bg-[#a855f7] scale-150"
                : "bg-white/10"
            }`}
          />
        ))}
        <span className="ml-2 font-mono text-[10px] text-[#a1a1aa]">
          {questionNumber}/{total}
        </span>
      </div>

      {/* Question */}
      <p className="font-mono text-sm text-[#d4d4d8]">
        <span className="text-[#a855f7] mr-2">›</span>
        <TypewriterText
          text={question.text}
          speed={22}
          cursor={false}
          onComplete={() => setQuestionReady(true)}
        />
      </p>

      {/* Input */}
      {questionReady && (
        <div className="flex flex-col gap-3 animate-fade-in-up">
          {/* Options */}
          {question.options && (
            <div className="flex flex-col gap-1.5">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  data-cursor
                  className={`text-left px-3 py-2.5 border font-mono text-sm transition-colors ${
                    selected.includes(opt)
                      ? "border-[#a855f7] text-[#fafafa] bg-[#a855f7]/10"
                      : "border-white/10 text-[#d4d4d8] bg-white/[0.02] hover:border-[#a855f7]/50 hover:text-[#fafafa]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {selected.includes(opt) && <span className="text-[#a855f7] mr-2">◈</span>}
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          {(question.type === "text" || question.withText) && (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setSphereState("listening")}
              placeholder={question.placeholder ?? ""}
              rows={3}
              className="w-full bg-transparent border-b border-white/15 focus:border-[#a855f7] px-0 py-2 text-[#fafafa] font-mono text-sm resize-none focus:outline-none placeholder:text-white/20 transition-colors"
            />
          )}

          {/* Continue */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            data-cursor
            className="self-end font-mono text-sm text-[#a1a1aa] hover:text-[#fafafa] disabled:opacity-20 transition-colors flex items-center gap-2 group"
          >
            <span className="text-[#a855f7] group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
