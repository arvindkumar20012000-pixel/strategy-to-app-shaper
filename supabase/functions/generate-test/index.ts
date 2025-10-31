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
    // Initialize Supabase client first to read settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API key from admin settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "LOVABLE_API_KEY")
      .maybeSingle();

    if (settingsError || !settingsData?.value) {
      console.error("LOVABLE_API_KEY not found in admin settings");
      throw new Error("LOVABLE_API_KEY not configured. Please add it in the admin panel.");
    }

    const LOVABLE_API_KEY = settingsData.value;
    const { subject, difficulty = "Medium", questionsCount = 20 } = await req.json();

    if (!subject) {
      throw new Error("Subject is required");
    }

    console.log(`Generating ${questionsCount} ${difficulty} questions for ${subject}`);

    // Use Lovable AI to generate test questions
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
  "correct_answer": "a" (or "b", "c", "d"),
  "explanation": "Brief explanation of the correct answer"
}`,
          },
          {
            role: "user",
            content: `Generate ${questionsCount} multiple-choice questions for ${subject} at ${difficulty} difficulty level. Focus on topics relevant to Indian competitive exams like UPSC, SSC, Banking, etc. Return ONLY the JSON array, no other text.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No content generated");
    }

    console.log("Raw AI response:", generatedText);

    // Parse the JSON response
    let questions;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse generated questions");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    console.log(`Successfully generated ${questions.length} questions`);

    // Create the mock test
    const testTitle = `AI Generated ${subject} Test - ${difficulty}`;
    const { data: testData, error: testError } = await supabase
      .from("mock_tests")
      .insert({
        title: testTitle,
        subject: subject,
        difficulty: difficulty,
        questions_count: questions.length,
        duration_minutes: questions.length * 2, // 2 minutes per question
      })
      .select()
      .single();

    if (testError) {
      console.error("Error creating test:", testError);
      throw new Error("Failed to create test");
    }

    console.log("Created test:", testData.id);

    // Insert questions
    const questionsToInsert = questions.map((q: any) => ({
      test_id: testData.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      throw new Error("Failed to save questions");
    }

    console.log(`Successfully saved ${questions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        testId: testData.id,
        testTitle: testTitle,
        questionsCount: questions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-test function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate test" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
