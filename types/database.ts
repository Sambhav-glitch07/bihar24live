export type Language = "hi" | "en";
export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";

export type Profile = {
  id: string;
  role: "owner";
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name_hi: string;
  name_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type District = {
  id: string;
  slug: string;
  name_hi: string;
  name_en: string;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: string;
  status: ArticleStatus;
  category_id: string | null;
  district_id: string | null;
  cover_media_id: string | null;
  author: string | null;
  is_featured: boolean;
  is_breaking: boolean;
  published_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleTranslation = {
  id: string;
  article_id: string;
  language: Language;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type BreakingNews = {
  id: string;
  text_hi: string | null;
  text_en: string | null;
  priority: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
