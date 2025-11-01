import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import NCERT from "./pages/NCERT";
import PreviousPapers from "./pages/PreviousPapers";
import MockTest from "./pages/MockTest";
import Auth from "./pages/Auth";
import TestTaking from "./pages/TestTaking";
import TestResult from "./pages/TestResult";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import Bookmarks from "./pages/Bookmarks";
import Downloads from "./pages/Downloads";
import History from "./pages/History";
import DoubtClearance from "./pages/DoubtClearance";
import LiveTests from "./pages/LiveTests";
import RequestContent from "./pages/RequestContent";
import Transactions from "./pages/Transactions";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="exampulse-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ncert"
              element={
                <ProtectedRoute>
                  <NCERT />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pyp"
              element={
                <ProtectedRoute>
                  <PreviousPapers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-test"
              element={
                <ProtectedRoute>
                  <MockTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/:id"
              element={
                <ProtectedRoute>
                  <TestTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-result/:attemptId"
              element={
                <ProtectedRoute>
                  <TestResult />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/doubt-clearance" element={<ProtectedRoute><DoubtClearance /></ProtectedRoute>} />
            <Route path="/live-tests" element={<ProtectedRoute><LiveTests /></ProtectedRoute>} />
            <Route path="/request-content" element={<ProtectedRoute><RequestContent /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
