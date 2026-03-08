import { Question } from "@/pages/TestTaking";

interface QuestionPaletteProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  getQuestionStatus: (id: string) => string;
  onQuestionSelect: (idx: number) => void;
  answeredCount: number;
  notAnsweredCount: number;
  markedCount: number;
  notVisitedCount: number;
  answeredMarkedCount: number;
  onSubmit: () => void;
}

const statusStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  answered: {
    bg: 'hsl(142, 71%, 40%)',
    border: 'hsl(142, 71%, 35%)',
    text: 'white',
    label: 'Answered',
  },
  "not-answered": {
    bg: 'hsl(0, 84%, 55%)',
    border: 'hsl(0, 84%, 45%)',
    text: 'white',
    label: 'Not Answered',
  },
  marked: {
    bg: 'hsl(270, 60%, 50%)',
    border: 'hsl(270, 60%, 40%)',
    text: 'white',
    label: 'Marked for Review',
  },
  "answered-marked": {
    bg: 'hsl(270, 60%, 50%)',
    border: 'hsl(142, 71%, 40%)',
    text: 'white',
    label: 'Answered & Marked',
  },
  "not-visited": {
    bg: 'hsl(220, 13%, 91%)',
    border: 'hsl(220, 13%, 80%)',
    text: 'hsl(222, 47%, 30%)',
    label: 'Not Visited',
  },
};

export const QuestionPalette = ({
  questions,
  currentQuestionIndex,
  getQuestionStatus,
  onQuestionSelect,
  answeredCount,
  notAnsweredCount,
  markedCount,
  notVisitedCount,
  answeredMarkedCount,
  onSubmit,
}: QuestionPaletteProps) => {
  return (
    <div className="p-3 space-y-4">
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          { style: statusStyles.answered, count: answeredCount },
          { style: statusStyles["not-answered"], count: notAnsweredCount },
          { style: statusStyles.marked, count: markedCount },
          { style: statusStyles["not-visited"], count: notVisitedCount },
          { style: statusStyles["answered-marked"], count: answeredMarkedCount },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{
                background: item.style.bg,
                color: item.style.text,
                border: item.style.label === 'Answered & Marked'
                  ? `2px solid ${item.style.border}`
                  : 'none',
              }}
            >
              {item.count}
            </span>
            <span className="text-[10px] leading-tight" style={{ color: 'hsl(220, 9%, 46%)' }}>
              {item.style.label}
            </span>
          </div>
        ))}
      </div>

      {/* Question Grid */}
      <div className="border-t pt-3">
        <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'hsl(220, 9%, 46%)' }}>
          Choose a Question
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q.id);
            const isCurrent = idx === currentQuestionIndex;
            const style = statusStyles[status] || statusStyles["not-visited"];

            return (
              <button
                key={idx}
                onClick={() => onQuestionSelect(idx)}
                className="w-full aspect-square rounded text-xs font-bold transition-all relative"
                style={{
                  background: style.bg,
                  color: style.text,
                  border: isCurrent ? '2px solid hsl(25, 95%, 53%)' : status === 'answered-marked' ? `2px solid ${style.border}` : '1px solid transparent',
                  boxShadow: isCurrent ? '0 0 0 2px hsl(25, 95%, 53%)' : 'none',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        className="w-full py-2.5 rounded-lg text-sm font-bold transition-colors"
        style={{
          background: 'hsl(235, 69%, 31%)',
          color: 'white',
        }}
      >
        Submit Test
      </button>
    </div>
  );
};
