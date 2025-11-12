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

    const { category = "education", language = "english" } = await req.json().catch(() => ({}));

    console.log(`Generating educational news for category: ${category}`);

    // Use Lovable AI to generate educational news articles
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const currentDate = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const languageInstruction = language === "hindi" 
      ? "सभी लेख, शीर्षक, विवरण और सामग्री केवल हिंदी भाषा में लिखें। (Write ALL articles, titles, descriptions, and content in HINDI language only.)" 
      : "Generate all content in English language.";
    
    const prompt = `${languageInstruction}

Current Date: ${currentDate}

Generate 5 LATEST and MOST RECENT current affairs news articles from TODAY or THIS WEEK that are highly relevant for competitive exam preparation in India.

Focus on BREAKING NEWS and RECENT UPDATES about:
- Latest SSC exam notifications and updates (last 7 days)
- Recent Railway recruitment announcements
- Banking sector news and exam notifications
- UPSC current affairs and recent policy updates
- State PSC latest notifications
- Defence recruitment recent announcements
- Important government schemes launched THIS WEEK
- Recent constitutional appointments (last few days)
- Major economic and policy decisions from THIS WEEK
- Latest amendments in laws and regulations

For each article, provide:
- title: Catchy headline about the latest update (max 100 chars)
- description: Brief summary of recent development (max 200 chars)
- content: Detailed article covering who, what, when, where, why (3-4 paragraphs)
- source: "ExamPulse Current Affairs"

Format as JSON array with keys: title, description, content, source

IMPORTANT: Focus ONLY on news from the last 7 days. Make it feel fresh, urgent, and immediately relevant for exam preparation happening NOW.`;

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
