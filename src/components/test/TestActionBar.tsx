import { ChevronLeft, Flag, RotateCcw, ChevronRight, Send } from "lucide-react";

interface TestActionBarProps {
  onMarkAndNext: () => void;
  onClearResponse: () => void;
  onSaveAndNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isMarked: boolean;
  onToggleMark: () => void;
}

export const TestActionBar = ({
  onMarkAndNext,
  onClearResponse,
  onSaveAndNext,
  onPrevious,
  onSubmit,
  isFirstQuestion,
  isLastQuestion,
  isMarked,
  onToggleMark,
}: TestActionBarProps) => {
  return (
    <div className="shrink-0 border-t" style={{ background: 'hsl(210, 25%, 92%)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="px-2 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-between">
        {/* Left actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onMarkAndNext}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded text-[11px] sm:text-xs font-semibold transition-colors"
            style={{
              background: 'hsl(270, 60%, 50%)',
              color: 'white',
            }}
          >
            <Flag className="w-3 h-3" />
            <span className="hidden xs:inline">Mark for Review</span>
            <span className="xs:hidden">Mark</span>
            <span className="hidden sm:inline"> & Next</span>
          </button>

          <button
            onClick={onClearResponse}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded text-[11px] sm:text-xs font-semibold border transition-colors"
            style={{
              borderColor: 'hsl(220, 13%, 80%)',
              color: 'hsl(222, 47%, 30%)',
              background: 'white',
            }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded text-[11px] sm:text-xs font-semibold border transition-colors disabled:opacity-40"
            style={{
              borderColor: 'hsl(220, 13%, 80%)',
              color: 'hsl(222, 47%, 30%)',
              background: 'white',
            }}
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Back</span>
          </button>

          {isLastQuestion ? (
            <button
              onClick={onSubmit}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-xs font-bold transition-colors"
              style={{
                background: 'hsl(0, 84%, 50%)',
                color: 'white',
              }}
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          ) : (
            <button
              onClick={onSaveAndNext}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-xs font-bold transition-colors"
              style={{
                background: 'hsl(235, 69%, 31%)',
                color: 'white',
              }}
            >
              <span>Save & Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
