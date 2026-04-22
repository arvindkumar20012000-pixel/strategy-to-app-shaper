import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const adminCheck = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleRow } = await adminCheck
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      subject,
      difficulty = "Medium",
      questionsCount = 20,
      language = "english",
      mode = "test", // "test" or "paper"
      paperName,
      year,
      examType,
    } = await req.json();

    if (!subject) {
      throw new Error("Subject is required");
    }
    if (mode === "paper" && (!paperName || !year || !examType)) {
      throw new Error("paperName, year and examType are required for PYP generation");
    }

    console.log(`[${mode}] Generating ${questionsCount} ${difficulty} ${subject} questions`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert test creator. Generate high-quality multiple-choice questions for competitive exams. Return ONLY a valid JSON array of questions. Each question must have exactly this structure:
{
  "question_text": "The question text",
  "option_a": "First option",
  "option_b": "Second option", 
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct_answer": "A" (must be uppercase: "A", "B", "C", or "D"),
  "explanation": "Brief explanation of the correct answer"
}`,
          },
          {
            role: "user",
            content: `${language === "hindi" ? "सभी प्रश्न, विकल्प और स्पष्टीकरण केवल हिंदी भाषा में उत्पन्न करें।" : "Generate all content in English language."}

Generate ${questionsCount} multiple-choice questions for ${subject} at ${difficulty} difficulty level${mode === "paper" ? `, in the style of the ${examType} ${paperName} ${year} previous year question paper` : ""}.

Difficulty Guidelines:
${difficulty === "Easy" ? "- Basic and straightforward, fundamental concepts" : difficulty === "Hard" ? "- Advanced, in-depth, analytical and application-based" : "- Moderate, mix of direct and application-based"}

Focus on topics relevant to Indian competitive exams (UPSC, SSC, Banking, Railway, State PSC, Defence, etc.).

Return ONLY the JSON array, no other text.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) throw new Error("No content generated");

    let questions;
    try {
      const cleanedText = generatedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse generated questions");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (mode === "paper") {
      const { data: paperData, error: paperError } = await supabase
        .from("previous_papers")
        .insert({
          exam_type: examType,
          paper_name: paperName,
          year: parseInt(String(year)),
          questions_count: questions.length,
          duration_minutes: questions.length * 2,
          difficulty,
        })
        .select()
        .single();

      if (paperError) throw new Error("Failed to create paper");

      const questionsToInsert = questions.map((q: any) => ({
        paper_id: paperData.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: String(q.correct_answer).toUpperCase(),
        explanation: q.explanation,
      }));

      const { error: qErr } = await supabase.from("questions").insert(questionsToInsert);
      if (qErr) throw new Error("Failed to save questions");

      return new Response(
        JSON.stringify({ success: true, paperId: paperData.id, questionsCount: questions.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // mode === "test"
    const testTitle = language === "hindi"
      ? `${subject} - ${difficulty} परीक्षा (AI जनित)`
      : `AI Generated ${subject} Test - ${difficulty}`;

    const { data: testData, error: testError } = await supabase
      .from("mock_tests")
      .insert({
        title: testTitle,
        subject: subject,
        difficulty: difficulty,
        questions_count: questions.length,
        duration_minutes: questions.length * 2,
      })
      .select()
      .single();

    if (testError) throw new Error("Failed to create test");

    const questionsToInsert = questions.map((q: any) => ({
      test_id: testData.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: String(q.correct_answer).toUpperCase(),
      explanation: q.explanation,
    }));

    const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert);
    if (questionsError) throw new Error("Failed to save questions");

    return new Response(
      JSON.stringify({ success: true, testId: testData.id, testTitle, questionsCount: questions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-test function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate test" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
