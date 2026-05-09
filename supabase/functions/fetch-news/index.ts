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

    console.log(`Fetching exam-focused news for language: ${language}`);

    const { data: apiKeyData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "NEWS_API_KEY")
      .maybeSingle();

    const NEWS_API_KEY = apiKeyData?.value;
    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY not configured in admin settings");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Clean old articles (>2 days)
    const { error: cleanError } = await supabase.rpc("clean_old_articles");
    if (cleanError) console.error("Error cleaning old articles:", cleanError);

    // Strict 48-hour window using full ISO datetime
    const now = new Date();
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fromIso = cutoff.toISOString();
    const toIso = now.toISOString();

    const examKeywords = [
      "SSC OR UPSC OR Railway OR Banking exam OR government job OR sarkari naukri",
      "India education policy OR NCERT OR examination result OR admit card",
      "current affairs India OR economy OR constitution OR parliament OR supreme court",
    ];

    let newsArticles: any[] = [];

    for (const query of examKeywords) {
      if (newsArticles.length >= 10) break;
      try {
        const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&sortBy=publishedAt&pageSize=8&apiKey=${NEWS_API_KEY}`;
        console.log(`Fetching: ${query.substring(0, 40)}...`);
        const res = await fetch(apiUrl);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === "error") continue;
        const filtered = (data.articles || []).filter((a: any) => {
          if (!a.publishedAt || !a.title || a.title === "[Removed]") return false;
          const d = new Date(a.publishedAt);
          // Hard-enforce 48-hour rule client-side too
          return d >= cutoff && d <= now;
        });
        newsArticles.push(...filtered);
      } catch (e) {
        console.log(`Error fetching query: ${e}`);
      }
    }

    // Fallback: top headlines from India
    if (newsArticles.length === 0) {
      try {
        const fallbackUrl = `https://newsapi.org/v2/top-headlines?country=in&pageSize=10&apiKey=${NEWS_API_KEY}`;
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          const data = await res.json();
          newsArticles = (data.articles || []).filter((a: any) => a.title && a.title !== "[Removed]");
        }
      } catch (e) {
        console.log(`Fallback error: ${e}`);
      }
    }

    if (newsArticles.length === 0) {
      throw new Error("No recent exam-related articles found. Please try again later.");
    }

    // Deduplicate by title and limit to 10
    const seen = new Set<string>();
    newsArticles = newsArticles.filter(a => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    }).slice(0, 10);

    console.log(`Fetched ${newsArticles.length} exam-focused articles`);

    const originalArticles = newsArticles.map((a: any) => ({
      title: a.title,
      description: a.description || "",
      content: a.content || "",
      source: a.source?.name || "Unknown",
      author: a.author || "StudyByte",
      url: a.url,
      image_url: a.urlToImage,
      published_at: a.publishedAt,
    }));

    const newsContent = newsArticles
      .map((a: any, i: number) =>
        `${i + 1}. ${a.title}\nSource: ${a.source?.name || "Unknown"}\nAuthor: ${a.author || "N/A"}\n${a.description || ""}\n${a.content || ""}`
      )
      .join("\n\n");

    const langInstruction = language === "hindi"
      ? "अनुवाद करें और सभी आउटपुट (title, description, content सहित) पूरी तरह हिंदी (देवनागरी लिपि) में लिखें। अंग्रेज़ी शब्द न रखें (छोड़ कर: संस्था के नाम जैसे SSC, UPSC, NCERT)।"
      : "Generate all content in English.";

    const prompt = `${langInstruction}

You are an expert current affairs editor for competitive exam aspirants (SSC, UPSC, Railway, Banking, State PCS).

Summarize the following news articles. Focus on WHY each article is important for exam preparation. Highlight facts, dates, names, and figures that could appear in exam questions.

STRICT RULES:
1. Keep ORIGINAL source name and author
2. NO brackets or parentheses
3. Keep it exam-focused and factual

News Articles:
${newsContent}

For each article provide:
- title: Clear headline - max 100 chars
- description: One sentence summary - max 150 chars
- content: Use this structure:

## What Happened
2-3 sentences explaining the event.

## Key Facts for Exams
• First important fact with specific data
• Second important fact
• Third important fact

## Why It Matters for Exams
1-2 sentences on exam relevance.

## Background
1-2 sentences of context.

IMPORTANT: Each bullet on separate line starting with "• ". No brackets.

- source: Keep ORIGINAL source name
- author: Keep ORIGINAL author name

Format as JSON array with keys: title description content source author
Return ALL articles.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || "[]";

    let articlesData;
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      articlesData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response");
      articlesData = [];
    }

    const articles = articlesData.map((article: any, index: number) => {
      const orig = originalArticles[index] || {};
      const pubDate = orig.published_at
        ? new Date(orig.published_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      return {
        title: article.title || orig.title || `Exam Update ${index + 1}`,
        description: article.description || orig.description || "",
        content: article.content || orig.content || "",
        source: article.source || orig.source || "StudyByte",
        image_url: orig.image_url || null,
        category: "current-affairs",
        published_date: pubDate,
        language,
      };
    });

    if (articles.length > 0) {
      const { error: insertError } = await supabase
        .from("articles")
        .upsert(articles, { onConflict: "title", ignoreDuplicates: true });
      if (insertError) console.error("Insert error:", insertError);
      else console.log(`Stored ${articles.length} exam-focused articles`);
    }

    return new Response(
      JSON.stringify({ success: true, articlesCount: articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Failed to generate news" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
