import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { radioSettingsQueryOptions } from "@/lib/radio-context";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";

const newsDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*,category:categories(name,slug)")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/noticia/$slug")({
  loader: async ({ params: { slug }, context: { queryClient } }) => {
    const [news, radio] = await Promise.all([
      queryClient.ensureQueryData(newsDetailQuery(slug)),
      queryClient.ensureQueryData(radioSettingsQueryOptions),
    ]);
    return { news, radio };
  },
  head: ({ loaderData, params: { slug } }) => {
    if (!loaderData?.news) return { title: "Notícia não encontrada" };
    const { news, radio } = loaderData;
    const stationName = radio?.station_name || "Alternativa gospel";
    const title = `${news.title} | ${stationName}`;
    const description = news.excerpt || news.title;

    // Tenta encontrar a primeira imagem no conteúdo se não houver imagem de capa
    const contentImageMatch = news.content?.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)/i);
    const ogImage = news.cover_image || (contentImageMatch ? contentImageMatch[0] : radio?.logo_url);
    const url = `https://gospel-radio-portal.lovable.app/noticia/${slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage || "" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage || "" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: news.title,
            description,
            ...(ogImage ? { image: [ogImage] } : {}),
            ...(news.published_at ? { datePublished: news.published_at } : {}),
            ...(news.updated_at ? { dateModified: news.updated_at } : {}),
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            publisher: {
              "@type": "Organization",
              name: stationName,
              ...(radio?.logo_url ? { logo: { "@type": "ImageObject", url: radio.logo_url } } : {}),
            },
          }),
        },
      ],
    };
  },
  component: NewsPage,
});

function NewsPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery(newsDetailQuery(slug));

  const newsId = data?.id;
  useEffect(() => {
    if (newsId) {
      supabase
        .from("news")
        .update({ views: (data.views ?? 0) + 1 })
        .eq("id", newsId)
        .then(() => {});
    }
  }, [newsId]);

  if (!data)
    return <div className="container mx-auto py-20 text-center">Notícia não encontrada.</div>;

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      {data.category && (
        <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">
          {(data.category as any).name}
        </div>
      )}
      <h1 className="font-display text-4xl md:text-5xl text-primary mb-4">{data.title}</h1>
      {data.excerpt && <p className="text-lg text-muted-foreground mb-6">{data.excerpt}</p>}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
        <Calendar className="w-4 h-4" />
        {data.published_at &&
          new Date(data.published_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
      </div>
      {data.cover_image && (
        <img
          src={data.cover_image}
          alt={data.title}
          className="w-full rounded-xl mb-8 aspect-[16/9] object-cover"
        />
      )}
      <div className="prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">
        {data.content}
      </div>
    </article>
  );
}
