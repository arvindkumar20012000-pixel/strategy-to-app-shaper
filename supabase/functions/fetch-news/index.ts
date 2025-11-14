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

    // Fetch news from NewsAPI.org - ONLY source for articles
    let newsArticles: any[] = [];
    let newsApiError: string | null = null;
    
    // Try multiple NewsAPI endpoints to get articles
    const newsApiQueries = [
      // Try general India news
      `https://newsapi.org/v2/top-headlines?country=in&pageSize=10&apiKey=${NEWS_API_KEY}`,
      // Try without country but with India-related keywords
      `https://newsapi.org/v2/everything?q=India+government+policy+economy&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`,
      // Try global top headlines
      `https://newsapi.org/v2/top-headlines?pageSize=10&apiKey=${NEWS_API_KEY}`,
    ];
    
    for (const apiUrl of newsApiQueries) {
      try {
        console.log(`Trying NewsAPI endpoint: ${apiUrl.split('?')[0]}`);
        const newsResponse = await fetch(apiUrl);
        
        if (!newsResponse.ok) {
          const errorText = await newsResponse.text();
          console.log(`NewsAPI returned status ${newsResponse.status}: ${errorText}`);
          continue;
        }
        
        const newsData = await newsResponse.json();
        console.log(`NewsAPI response:`, JSON.stringify(newsData).substring(0, 200));
        
        if (newsData.status === "error") {
          console.log(`NewsAPI error: ${newsData.message || newsData.code}`);
          newsApiError = newsData.message || newsData.code;
          continue;
        }
        
        newsArticles = newsData.articles || [];
        
        if (newsArticles.length > 0) {
          console.log(`Successfully fetched ${newsArticles.length} articles from NewsAPI`);
          break;
        }
      } catch (error: any) {
        console.log(`Error with NewsAPI endpoint: ${error.message || error}`);
      }
    }
    
    if (newsArticles.length === 0) {
      const errorMsg = newsApiError 
        ? `NewsAPI error: ${newsApiError}. Please check your API key in admin settings.`
        : "No articles available from NewsAPI. Please try again later or check your API key.";
      throw new Error(errorMsg);
    }
    
    console.log(`Fetched ${newsArticles.length} news articles from NewsAPI`);
    
    // Store original articles data for reference
    const originalArticles = newsArticles.map((article: any) => ({
      title: article.title,
      description: article.description || "",
      content: article.content || "",
      source: article.source?.name || "Unknown",
      author: article.author || "ExamPulse",
      url: article.url,
      image_url: article.urlToImage,
    }));
    
    // Prepare news for AI summarization
    const newsContent = newsArticles
      .map((article: any, idx: number) => 
        `${idx + 1}. ${article.title}\nSource: ${article.source?.name || "Unknown"}\nAuthor: ${article.author || "N/A"}\n${article.description || ""}\n${article.content || ""}`
      )
      .join("\n\n");

    const languageInstruction = language === "hindi" 
      ? "सभी लेख, शीर्षक, विवरण और सामग्री केवल हिंदी भाषा में लिखें। (Write ALL summaries, titles, descriptions, and content in HINDI language only.)" 
      : "Generate all content in English language.";

    // Summarize NewsAPI articles for exam relevance
    const prompt = `${languageInstruction}

I have the following latest news articles. Summarize and rewrite ALL 10 articles with an exam-focused perspective for competitive exam students in India (SSC, Railway, Banking, UPSC, State PSC, Defence exams).

IMPORTANT: Keep the ORIGINAL source name and author from each article. Summarize ALL articles, prioritizing those most relevant to:
- Government policies and schemes
- Economic decisions and budget updates
- International relations and diplomacy
- Constitutional appointments
- Legal amendments
- Education sector news
- Employment and recruitment news

News Articles:
${newsContent}

For each article, provide:
- title: Clear exam-focused headline (max 100 chars)
- description: Key points for exam preparation (max 200 chars)  
- content: Detailed summary with exam relevance (3-4 paragraphs)
- source: Keep the ORIGINAL source name from the article
- author: Keep the ORIGINAL author name from the article

Format as JSON array with keys: title, description, content, source, author

Return ALL 10 articles, sorted by relevance to competitive exams (most relevant first).`;

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

    // Format articles for database with original metadata
    const articles = articlesData.map((article: any, index: number) => {
      const originalArticle = originalArticles[index] || {};
      return {
        title: article.title || originalArticle.title || `Current Affairs Update ${index + 1}`,
        description: article.description || originalArticle.description || "",
        content: article.content || originalArticle.content || "",
        source: article.source || originalArticle.source || "ExamPulse",
        image_url: originalArticle.image_url || null,
        category: "current-affairs",
        published_date: new Date().toISOString().split("T")[0],
      };
    });

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
