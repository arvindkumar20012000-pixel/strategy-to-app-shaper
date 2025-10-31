import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderOpen, Plus, Loader2, Trash2 } from "lucide-react";

interface ExamCategory {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
}

export function ExamCategories() {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("Failed to load categories");
    } finally {
      setFetching(false);
    }
  };

  const handleAddCategory = async () => {
    if (!name || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("exam_categories").insert({
        name,
        description,
        icon_url: iconUrl || null,
      });

      if (error) throw error;

      toast.success("Category added successfully");
      setName("");
      setDescription("");
      setIconUrl("");
      await fetchCategories();
    } catch (error: any) {
      toast.error("Failed to add category: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("exam_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Category deleted");
      await fetchCategories();
    } catch (error: any) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Exam Categories</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., SSC, Railway"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter category description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="icon-url">Icon URL (optional)</Label>
            <Input
              id="icon-url"
              placeholder="https://example.com/icon.png"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleAddCategory} disabled={loading} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Current Categories</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCategory(category.id)}
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
