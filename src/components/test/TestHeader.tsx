import { Clock, Pause, LayoutGrid } from "lucide-react";

interface TestHeaderProps {
  testName: string;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  onPause: () => void;
  onOpenPalette?: () => void;
  totalTime: number;
}

export const TestHeader = ({ testName, timeLeft, formatTime, onPause, onOpenPalette, totalTime }: TestHeaderProps) => {
  const timePercentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isLowTime = timeLeft < 300; // less than 5 minutes
  const isCriticalTime = timeLeft < 60; // less than 1 minute

  return (
    <div className="shrink-0">
      {/* Primary Header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'hsl(235, 69%, 25%)', color: 'white' }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenPalette}
            className="w-9 h-9 rounded flex items-center justify-center shrink-0 text-[10px] font-bold gap-0.5 flex-col hover:brightness-110 active:scale-95 transition-all"
            style={{ background: 'hsl(235, 69%, 40%)' }}
            title="Open Question Palette"
            aria-label="Open Question Palette"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[8px] leading-none">CBT</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold truncate">{testName}</h1>
            <p className="text-[10px] opacity-70">Computer Based Test</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPause}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Pause Test"
          >
            <Pause className="w-4 h-4" />
          </button>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm font-bold transition-colors ${
              isCriticalTime
                ? 'animate-pulse'
                : ''
            }`}
            style={{
              background: isCriticalTime
                ? 'hsl(0, 84%, 50%)'
                : isLowTime
                ? 'hsl(25, 95%, 53%)'
                : 'hsl(142, 71%, 35%)',
              color: 'white',
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="h-1 w-full" style={{ background: 'hsl(210, 20%, 90%)' }}>
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${timePercentage}%`,
            background: isCriticalTime
              ? 'hsl(0, 84%, 50%)'
              : isLowTime
              ? 'hsl(25, 95%, 53%)'
              : 'hsl(142, 71%, 45%)',
          }}
        />
      </div>
    </div>
  );
};
