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
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    const { category = "general", country = "in" } = await req.json().catch(() => ({}));

    console.log(`Fetching news for category: ${category}, country: ${country}`);

    // Fetch news from NewsAPI
    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=20`,
      {
        headers: {
          "X-Api-Key": NEWS_API_KEY,
        },
      }
    );

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error("NewsAPI error:", errorText);
      throw new Error(`NewsAPI error: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    console.log(`Fetched ${newsData.articles?.length || 0} articles`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process and store articles
    const articles = newsData.articles?.map((article: any) => ({
      title: article.title || "Untitled",
      description: article.description,
      content: article.content,
      source: article.source?.name,
      image_url: article.urlToImage,
      category: category,
      published_date: new Date(article.publishedAt).toISOString().split("T")[0],
    })) || [];

    // Insert articles into database (ignore duplicates)
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
  } catch (error: any) {
    console.error("Error in fetch-news function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch news" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
