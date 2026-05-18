import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*, logo_settings")
      .limit(1)
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST303" || error.message?.includes("JWT expired")) {
        console.warn("Supabase JWT expired in siteSettingsQuery");
        return null;
      }
      throw error;
    }
    return data;
  },
});

export function useSiteSettings() {
  return useQuery(siteSettingsQuery);
}

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
    const { data, error } = await supabase
      .from("news")
      .select(
        "id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)",
      )
      .eq("published", true)
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST303" || error.message?.includes("JWT expired")) {
        console.warn("Supabase JWT expired in featuredNewsQuery");
        return null;
      }
      throw error;
    }
    return data as NewsItem | null;
  },
});

export const latestNewsQuery = queryOptions({
  queryKey: ["news", "latest"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("news")
      .select(
        "id,slug,title,excerpt,cover_image,published_at,featured,category:categories(name,slug)",
      )
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(6);
    if (error) {
      if (error.code === "PGRST303" || error.message?.includes("JWT expired")) {
        console.warn("Supabase JWT expired in latestNewsQuery");
        return [];
      }
      throw error;
    }
    return (data ?? []) as NewsItem[];
  },
});

export function useFeaturedNews() {
  return useSuspenseQuery(featuredNewsQuery);
}

export function useLatestNews() {
  return useSuspenseQuery(latestNewsQuery);
}
