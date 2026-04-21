"use client";

import { useState } from "react";
import { type Question } from "./questions";

interface Props {
  question: Question;
  questionNumber: number;
  total: number;
  onAnswer: (answer: string) => void;
}

/**
 * QuestionScreen — renders a single onboarding question.
 * Supports text input, single select, and multi-select.
 */
export function QuestionScreen({ question, questionNumber, total, onAnswer }: Props) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const canContinue =
    question.type === "text"
      ? text.trim().length > 0
      : selected.length > 0 || (question.withText && text.trim().length > 0);

  const handleContinue = () => {
    let answer = "";
    if (question.type === "text") {
      answer = text.trim();
    } else if (question.type === "select") {
      answer = selected[0] ?? text.trim();
    } else {
      // multiselect: join selections + optional text
      const parts = [...selected];
      if (question.withText && text.trim()) parts.push(text.trim());
      answer = parts.join(", ");
    }
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/10 rounded-full h-1">
          <div
            className="bg-[#6C63FF] h-1 rounded-full transition-all duration-500"
            style={{ width: `${(questionNumber / total) * 100}%` }}
          />
        </div>
        <span className="text-[#8888A0] text-xs font-mono whitespace-nowrap">
          {questionNumber} / {total}
        </span>
      </div>

      {/* Block label */}
      <span className="text-[#6C63FF] text-xs font-mono uppercase tracking-widest">
        {question.block}
      </span>

      {/* Question */}
      <h2 className="text-white text-xl font-medium leading-relaxed">{question.text}</h2>

      {/* Input */}
      <div className="flex flex-col gap-3">
        {/* Options */}
        {question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  selected.includes(opt)
                    ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white"
                    : "border-white/10 bg-[#0D0D14] text-[#8888A0] hover:border-white/30 hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text field */}
        {(question.type === "text" || question.withText) && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={question.placeholder ?? "Tu respuesta..."}
            rows={3}
            className="bg-[#0D0D14] border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
          />
        )}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-30 text-white font-mono py-3 px-6 rounded-lg transition-colors self-start"
      >
        Continuar →
      </button>
    </div>
  );
}
