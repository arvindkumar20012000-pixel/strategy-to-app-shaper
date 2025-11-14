import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Loader2, Trash2 } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  published_date: string;
}

export function ArticleManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      toast.error("Failed to load articles");
    } finally {
      setFetching(false);
    }
  };

  const handleGenerateNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-news", {
        body: { language }
      });
      
      if (error) throw error;
      
      toast.success("News articles fetched successfully");
      await fetchArticles();
    } catch (error: any) {
      toast.error("Failed to generate news: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
    }
  };

  const handleAddArticle = async () => {
    if (!title || !description || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("article-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("articles").insert({
        title,
        description,
        category,
        image_url: imageUrl,
        published_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success("Article added successfully");
      setTitle("");
      setDescription("");
      setCategory("");
      setImageFile(null);
      await fetchArticles();
    } catch (error: any) {
      toast.error("Failed to add article: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Article deleted");
      await fetchArticles();
    } catch (error: any) {
      toast.error("Failed to delete article");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Article Management</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="news-language">Language for AI News</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="news-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateNews} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Generate AI News
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              placeholder="Enter article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter article description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Current Affairs, Education"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="imageFile">Article Image (optional, Max 5MB)</Label>
            <Input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
            {imageFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {imageFile.name}
              </p>
            )}
          </div>
          <Button onClick={handleAddArticle} disabled={loading} className="w-full">
            Add Article
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Articles</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{article.title}</h4>
                  <p className="text-sm text-muted-foreground">{article.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteArticle(article.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
