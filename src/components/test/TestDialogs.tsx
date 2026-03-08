import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TestDialogsProps {
  pauseDialogOpen: boolean;
  setPauseDialogOpen: (open: boolean) => void;
  submitDialogOpen: boolean;
  setSubmitDialogOpen: (open: boolean) => void;
  onPause: () => void;
  onSubmit: () => void;
  answeredCount: number;
  notAnsweredCount: number;
  markedCount: number;
  totalQuestions: number;
  timeLeft: number;
  formatTime: (seconds: number) => string;
}

export const TestDialogs = ({
  pauseDialogOpen,
  setPauseDialogOpen,
  submitDialogOpen,
  setSubmitDialogOpen,
  onPause,
  onSubmit,
  answeredCount,
  notAnsweredCount,
  markedCount,
  totalQuestions,
  timeLeft,
  formatTime,
}: TestDialogsProps) => {
  return (
    <>
      {/* Pause Dialog */}
      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Examination?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved. You can resume this test later from the Mock Tests page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
            <div className="p-3 rounded-lg" style={{ background: 'hsl(142, 71%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Answered</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(142, 71%, 35%)' }}>{answeredCount}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(210, 20%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Time Left</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(235, 69%, 31%)' }}>{formatTime(timeLeft)}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={onPause}>Pause & Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Examination?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, you cannot modify your answers. Please review your attempt summary below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
            <div className="p-3 rounded-lg" style={{ background: 'hsl(210, 20%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Total</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(235, 69%, 31%)' }}>{totalQuestions}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(142, 71%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Answered</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(142, 71%, 35%)' }}>{answeredCount}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(0, 84%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Unanswered</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(0, 84%, 50%)' }}>{notAnsweredCount}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(270, 60%, 95%)' }}>
              <p className="text-xs" style={{ color: 'hsl(220, 9%, 46%)' }}>Marked</p>
              <p className="text-lg font-bold" style={{ color: 'hsl(270, 60%, 40%)' }}>{markedCount}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit} className="bg-destructive hover:bg-destructive/90">
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
