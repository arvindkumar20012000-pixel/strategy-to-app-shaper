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

    const { language = "english" } = await req.json().catch(() => ({}));

    console.log(`Fetching fresh news for language: ${language}`);

    // Get News API key from admin settings
    const { data: apiKeyData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "NEWS_API_KEY")
      .maybeSingle();

    const NEWS_API_KEY = apiKeyData?.value;
    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY not configured in admin settings");
    }

    // Use Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Clean old articles (older than 7 days)
    const { error: cleanError } = await supabase.rpc("clean_old_articles");
    if (cleanError) {
      console.error("Error cleaning old articles:", cleanError);
    } else {
      console.log("Cleaned old articles");
    }

    // Try to fetch news from NewsAPI.org
    let newsContent = "";
    let useAIGeneration = true;
    
    try {
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=in&category=general&pageSize=10&apiKey=${NEWS_API_KEY}`;
      
      const newsResponse = await fetch(newsApiUrl);
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        const newsArticles = newsData.articles || [];
        
        console.log(`Fetched ${newsArticles.length} news articles from NewsAPI`);

        if (newsArticles.length > 0) {
          // Prepare news for AI summarization
          newsContent = newsArticles
            .map((article: any, idx: number) => 
              `${idx + 1}. ${article.title}\n${article.description || ""}\n${article.content || ""}`
            )
            .join("\n\n");
          useAIGeneration = false;
        }
      } else {
        console.log(`NewsAPI returned status: ${newsResponse.status}, falling back to AI generation`);
      }
    } catch (error) {
      console.log("NewsAPI fetch failed, falling back to AI generation:", error);
    }

    const languageInstruction = language === "hindi" 
      ? "सभी लेख, शीर्षक, विवरण और सामग्री केवल हिंदी भाषा में लिखें। (Write ALL summaries, titles, descriptions, and content in HINDI language only.)" 
      : "Generate all content in English language.";
    
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let prompt;
    
    if (useAIGeneration || !newsContent) {
      // Generate fresh news using AI when NewsAPI is not available
      prompt = `${languageInstruction}

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
    } else {
      // Summarize NewsAPI articles
      prompt = `${languageInstruction}

I have the following latest news articles from today. Summarize and rewrite ONLY the 5 most relevant articles for competitive exam students in India (SSC, Railway, Banking, UPSC, State PSC, Defence exams).

Focus on:
- Government policies and schemes
- Economic decisions and budget updates
- International relations and diplomacy
- Constitutional appointments
- Legal amendments
- Education sector news
- Employment and recruitment news

News Articles:
${newsContent}

For each of the 5 MOST RELEVANT articles, provide:
- title: Clear exam-focused headline (max 100 chars)
- description: Key points for exam preparation (max 200 chars)
- content: Detailed summary with exam relevance, covering who, what, when, where, why (3-4 paragraphs)
- source: "ExamPulse Current Affairs"

Format as JSON array with keys: title, description, content, source

IMPORTANT: Only select articles that are directly relevant to competitive exam preparation. Skip entertainment, sports, or celebrity news.`;
    }

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

    console.log(`Generated ${articlesData.length} summarized articles`);

    // Format articles for database
    const articles = articlesData.map((article: any, index: number) => ({
      title: article.title || `Current Affairs Update ${index + 1}`,
      description: article.description || "",
      content: article.content || "",
      source: article.source || "ExamPulse Current Affairs",
      image_url: null,
      category: "current-affairs",
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
