export interface Game {
  id: string;
  slug?: string; // SEO-friendly slug; generated from title
  title: string;
  featured?: boolean;
  genre?: string[];
  platforms?: string[];
  mobile?: boolean;
  height?: number;
  width?: number;
  rating?: number;
  released?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  url?: string;
  updatedAt?: string; // server-managed last update timestamp (ISO)
}
