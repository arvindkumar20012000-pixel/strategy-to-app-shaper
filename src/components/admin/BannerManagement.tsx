import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image, Loader2, Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Banner {
  id: string;
  title: string;
  image_path: string;
  display_order: number;
  is_active: boolean;
}

export function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast.error("Failed to load banners");
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

  const handleAddBanner = async () => {
    if (!title || !imageFile) {
      toast.error("Please provide title and image");
      return;
    }

    if (banners.length >= 3) {
      toast.error("Maximum 3 banners allowed. Delete one to add new.");
      return;
    }

    setUploading(true);
    try {
      // Upload image
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

      // Insert banner record
      const { error: insertError } = await supabase.from("banners").insert({
        title,
        image_path: filePath,
        display_order: banners.length + 1,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast.success("Banner added successfully");
      setTitle("");
      setImageFile(null);
      await fetchBanners();
    } catch (error: any) {
      toast.error("Failed to add banner: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Banner status updated");
      await fetchBanners();
    } catch (error: any) {
      toast.error("Failed to update banner");
    }
  };

  const handleDeleteBanner = async (id: string, imagePath: string) => {
    setLoading(true);
    try {
      // Delete image from storage
      const { error: storageError } = await supabase.storage
        .from("banners")
        .remove([imagePath]);

      if (storageError) throw storageError;

      // Delete banner record
      const { error: deleteError } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast.success("Banner deleted");
      await fetchBanners();
    } catch (error: any) {
      toast.error("Failed to delete banner");
    } finally {
      setLoading(false);
    }
  };

  const getBannerImageUrl = (path: string) => {
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Image className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Banner Management</h2>
          <span className="text-sm text-muted-foreground ml-2">
            ({banners.length}/3 banners)
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="banner-title">Banner Title</Label>
            <Input
              id="banner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter banner title"
            />
          </div>

          <div>
            <Label htmlFor="banner-image">Banner Image (Max 5MB)</Label>
            <Input
              id="banner-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
            />
            {imageFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <Button
            onClick={handleAddBanner}
            disabled={uploading || !title || !imageFile || banners.length >= 3}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Add Banner
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Banners</h3>
        <div className="space-y-4">
          {banners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No banners yet. Add up to 3 banners.
            </p>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <img
                  src={getBannerImageUrl(banner.image_path)}
                  alt={banner.title}
                  className="w-24 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{banner.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Order: {banner.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={() =>
                      handleToggleActive(banner.id, banner.is_active)
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteBanner(banner.id, banner.image_path)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
