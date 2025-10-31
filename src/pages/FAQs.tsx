import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I start preparing for exams?",
    answer:
      "Begin by selecting your target exam from the available categories. Take a diagnostic test to understand your current level, then follow a structured study plan using our mock tests and previous papers.",
  },
  {
    question: "What is included in Premium membership?",
    answer:
      "Premium membership includes unlimited mock tests, all previous year papers, detailed solutions, performance analytics, doubt clearance, ad-free experience, and priority support.",
  },
  {
    question: "How can I track my progress?",
    answer:
      "Visit the Attempt History page to see all your test attempts with detailed analytics including scores, time taken, and areas of improvement.",
  },
  {
    question: "Can I download study materials?",
    answer:
      "Yes! Premium members can download PDFs of previous papers, study materials, and solution sheets for offline study.",
  },
  {
    question: "How does the referral program work?",
    answer:
      "Share your unique referral code with friends. When they sign up and make a purchase, both you and your friend receive bonus credits in your wallet.",
  },
];

export default function FAQs() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
