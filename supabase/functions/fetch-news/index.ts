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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { category = "education" } = await req.json().catch(() => ({}));

    console.log(`Generating educational news for category: ${category}`);

    // Use Lovable AI to generate educational news articles
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Generate 5 recent educational news articles related to ${category}, exams, and student life in India. 
    For each article, provide:
    - title (max 100 chars)
    - description (max 200 chars)
    - content (2-3 paragraphs)
    - source name
    
    Format as JSON array with keys: title, description, content, source
    Make them relevant, informative, and recent (dated within last week).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse the AI response
    let articlesData;
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      articlesData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error("Failed to parse AI response, using fallback");
      articlesData = [];
    }

    console.log(`Generated ${articlesData.length} articles`);

    // Format articles for database
    const articles = articlesData.map((article: any, index: number) => ({
      title: article.title || `Educational Update ${index + 1}`,
      description: article.description || "",
      content: article.content || "",
      source: article.source || "ExamPulse News",
      image_url: null,
      category: category,
      published_date: new Date().toISOString().split("T")[0],
    }));

    // Insert articles into database
    if (articles.length > 0) {
      const { error: insertError } = await supabase
        .from("articles")
        .upsert(articles, { onConflict: "title", ignoreDuplicates: true });

      if (insertError) {
        console.error("Error inserting articles:", insertError);
      } else {
        console.log(`Successfully stored ${articles.length} articles`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articlesCount: articles.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in fetch-news function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Failed to generate news" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
