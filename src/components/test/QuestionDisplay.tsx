import { Question } from "@/pages/TestTaking";

interface QuestionDisplayProps {
  question: Question;
  questionIndex: number;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  isMarked: boolean;
}

export const QuestionDisplay = ({
  question,
  questionIndex,
  selectedAnswer,
  onAnswerSelect,
  isMarked,
}: QuestionDisplayProps) => {
  const options = [
    { key: "a", label: "A", text: question.option_a },
    { key: "b", label: "B", text: question.option_b },
    { key: "c", label: "C", text: question.option_c },
    { key: "d", label: "D", text: question.option_d },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Question Text */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'hsl(235, 69%, 31%)', color: 'white' }}
          >
            {questionIndex + 1}
          </span>
          <p className="text-sm sm:text-base leading-relaxed pt-1 font-medium" style={{ color: 'hsl(222, 47%, 11%)' }}>
            {question.question_text}
          </p>
        </div>
        {isMarked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-11"
            style={{ background: 'hsl(270, 60%, 92%)', color: 'hsl(270, 60%, 40%)' }}>
            ★ Marked for Review
          </span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5 ml-0 sm:ml-11">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.key;
          return (
            <button
              key={option.key}
              onClick={() => onAnswerSelect(option.key)}
              className="w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-lg border-2 text-left transition-all"
              style={{
                borderColor: isSelected ? 'hsl(235, 69%, 31%)' : 'hsl(220, 13%, 87%)',
                background: isSelected ? 'hsl(235, 69%, 96%)' : 'white',
              }}
            >
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: isSelected ? 'hsl(235, 69%, 31%)' : 'hsl(220, 13%, 91%)',
                  color: isSelected ? 'white' : 'hsl(222, 47%, 11%)',
                }}
              >
                {option.label}
              </span>
              <span className="text-sm sm:text-base pt-0.5" style={{ color: 'hsl(222, 47%, 11%)' }}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
