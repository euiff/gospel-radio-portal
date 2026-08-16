import { Link } from "@tanstack/react-router";
import { useRadio } from "@/lib/radio-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type NavItem = { to?: string; label?: string };

const FALLBACK_STATION_NAME = "Alternativa gospel";
const CURRENT_YEAR = "2026";

function FooterNavLink({ item }: { item: NavItem }) {
  const label = item.label || "Link";
  const to = item.to || "/";
  const className = "hover:text-gold transition-colors block py-1";
  const categoryMatch = to.match(/^\/categoria\/([^/]+)$/);

  if (to === "/")
    return (
      <Link to="/" className={className}>
        {label}
      </Link>
    );
  if (to === "/programacao")
    return (
      <Link to="/programacao" className={className}>
        {label}
      </Link>
    );
  if (to === "/login")
    return (
      <Link to="/login" className={className}>
        {label}
      </Link>
    );
  if (to === "/admin")
    return (
      <Link to="/admin" className={className}>
        {label}
      </Link>
    );
  if (categoryMatch)
    return (
      <Link to="/categoria/$slug" params={{ slug: categoryMatch[1] }} className={className}>
        {label}
      </Link>
    );

  const external = /^https?:\/\//.test(to);
  return (
    <a
      href={to}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {label}
    </a>
  );
}

export function Footer() {
  const { settings: radioSettings } = useRadio();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const stationName = radioSettings?.station_name || FALLBACK_STATION_NAME;
  const nav = (siteSettings?.navigation_menu as NavItem[] | null) || [];

  return (
    <footer className="gradient-deep text-white/80 mt-20 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-1">
            <div className="font-display text-3xl text-white font-bold leading-none flex items-center">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt="Logo"
                  className="h-12 md:h-20 w-auto max-w-[200px] md:max-w-[300px] object-contain filter brightness-0 invert transition-all hover:opacity-100 opacity-90"
                />
              ) : (
                <span className="flex items-center gap-1">{stationName}</span>
              )}
            </div>
            <p className="text-sm mt-4 text-white/60 leading-relaxed max-w-xs">
              {siteSettings?.site_description || radioSettings?.tagline || "A música que toca o coração"}
            </p>
          </div>

          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">
              Menu Principal
            </h4>
            <ul className="space-y-4 text-sm">
              {nav.length > 0 ? (
                nav.map((item, idx) => (
                  <li key={idx}>
                    <FooterNavLink item={item} />
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/" className="hover:text-gold transition-colors block py-1">
                      Início
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/programacao"
                      className="hover:text-gold transition-colors block py-1"
                    >
                      Programação Ao Vivo
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/categoria/$slug"
                      params={{ slug: "noticias" }}
                      className="hover:text-gold transition-colors block py-1"
                    >
                      Portal de Notícias
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/login" className="hover:text-gold transition-colors block py-1">
                  Acesso Administrativo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">
              Categorias
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: "musica" }}
                  className="hover:text-gold transition-colors block py-1"
                >
                  Lançamentos Musicais
                </Link>
              </li>
              <li>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: "eventos" }}
                  className="hover:text-gold transition-colors block py-1"
                >
                  Eventos e Shows
                </Link>
              </li>
              <li>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: "devocional" }}
                  className="hover:text-gold transition-colors block py-1"
                >
                  Mensagens de Fé
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">
              Fale Conosco
            </h4>
            {radioSettings?.whatsapp && (
              <a
                href={`https://wa.me/${radioSettings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-gold/20 hover:border-gold/30 transition-all text-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Chamar no WhatsApp
              </a>
            )}
            <p className="text-xs mt-6 text-white/40 italic">
              Envie seu pedido de oração ou sugestão musical.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-white/30 uppercase tracking-widest font-medium">
          <div>
            {siteSettings?.footer_text ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: siteSettings.footer_text.replace("{year}", CURRENT_YEAR),
                }}
              />
            ) : (
              <>
                © {CURRENT_YEAR} {stationName}.
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Termos de Uso</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
