import { Bookmark, Share2, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ArticleCardProps {
  title: string;
  date: string;
  category: string;
  description: string;
  imageUrl?: string;
  onBookmark?: () => void;
  onShare?: () => void;
  onRead?: () => void;
}

export const ArticleCard = ({
  title,
  date,
  category,
  description,
  imageUrl,
  onBookmark,
  onShare,
  onRead,
}: ArticleCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border">
      {imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {date}
          </div>
        </div>
        <h3 className="text-lg font-semibold line-clamp-2 text-foreground">
          {title}
        </h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="flex gap-2 justify-between">
        <Button onClick={onRead} variant="default" size="sm" className="flex-1">
          <BookOpen className="w-4 h-4" />
          Read
        </Button>
        <Button onClick={onBookmark} variant="ghost" size="icon">
          <Bookmark className="w-4 h-4" />
        </Button>
        <Button onClick={onShare} variant="ghost" size="icon">
          <Share2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
