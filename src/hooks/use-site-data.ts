import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  featured: boolean;
  category: { name: string; slug: string } | null;
}

export const featuredNewsQuery = queryOptions({
  queryKey: ["news", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase.from("news")
      .select("id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)")
      .eq("published", true).eq("featured", true)
      .order("published_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as NewsItem | null;
  },
});

export const latestNewsQuery = queryOptions({
  queryKey: ["news", "latest"],
  queryFn: async () => {
    const { data, error } = await supabase.from("news")
      .select("id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)")
      .eq("published", true).order("published_at", { ascending: false }).limit(6);
    if (error) throw error;
    return (data ?? []) as NewsItem[];
  },
});

export function useFeaturedNews() {
  return useSuspenseQuery(featuredNewsQuery);
}

export function useLatestNews() {
  return useSuspenseQuery(latestNewsQuery);
}