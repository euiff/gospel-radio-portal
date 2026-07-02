import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, Check, X, Award } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  reference: string | null;
}

function sessionId() {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem("quiz-session");
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem("quiz-session", s);
  }
  return s;
}

export function QuizCard() {
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [stats, setStats] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await (supabase as any)
        .from("quiz_questions")
        .select("id,question,options,correct_index,reference,starts_at,ends_at")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .limit(30);
      if (data && data.length) {
        const daySeed = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const idx = parseInt(daySeed, 10) % data.length;
        const q = data[idx];
        setQuestion({ ...q, options: q.options as string[] });

        const sid = sessionId();
        const { data: prev } = await supabase
          .from("quiz_answers")
          .select("selected_index,is_correct")
          .eq("question_id", q.id)
          .eq("session_id", sid)
          .maybeSingle();
        if (prev) {
          setSelected(prev.selected_index);
          setAnswered(true);
        }

        const { data: allAnswers } = await supabase
          .from("quiz_answers")
          .select("is_correct")
          .eq("question_id", q.id);
        if (allAnswers) {
          setStats({
            correct: allAnswers.filter((a) => a.is_correct).length,
            total: allAnswers.length,
          });
        }
      }
    })();
  }, []);

  const answer = async (i: number) => {
    if (answered || !question) return;
    const is_correct = i === question.correct_index;
    setSelected(i);
    setAnswered(true);
    await supabase.from("quiz_answers").insert({
      question_id: question.id,
      user_id: user?.id ?? null,
      session_id: sessionId(),
      selected_index: i,
      is_correct,
    });
    if (is_correct) toast.success("🎉 Resposta correta! Você conhece a Palavra.");
    else toast.error("Resposta errada — mas a Palavra sempre nos ensina algo novo.");
    setStats((prev) =>
      prev ? { correct: prev.correct + (is_correct ? 1 : 0), total: prev.total + 1 } : { correct: is_correct ? 1 : 0, total: 1 },
    );
  };

  if (!question) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-premium p-6 text-center text-sm text-muted-foreground">
        Nenhum quiz disponível hoje. Volte amanhã!
      </div>
    );
  }

  const acc = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-premium overflow-hidden">
      <div className="gradient-emerald text-white px-5 py-4 flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-white" />
        <div className="flex-1">
          <h3 className="font-display text-2xl leading-tight">Quiz Bíblico do Dia</h3>
          <p className="text-xs text-white/70">Teste seu conhecimento das Escrituras</p>
        </div>
      </div>
      <div className="p-5">
        <p className="font-display text-lg md:text-xl text-primary leading-snug mb-5">
          {question.question}
        </p>
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correct_index;
            const isPicked = selected === i;
            const showRight = answered && isCorrect;
            const showWrong = answered && isPicked && !isCorrect;
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-lg border transition font-medium text-sm flex items-center gap-3 ${
                  showRight
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : showWrong
                      ? "border-red-500 bg-red-50 text-red-900"
                      : answered
                        ? "border-border bg-muted/40 text-muted-foreground"
                        : "border-border hover:border-primary hover:bg-primary/5"
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-white border border-current flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {showRight && <Check className="w-4 h-4" />}
                {showWrong && <X className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
        {answered && question.reference && (
          <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30 text-xs text-primary">
            📖 <strong>Referência:</strong> {question.reference}
          </div>
        )}
        {acc !== null && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="w-4 h-4 text-gold" />
            {stats!.total} ouvintes responderam · {acc}% acertaram
          </div>
        )}
      </div>
    </div>
  );
}