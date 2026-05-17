import { Link } from "@tanstack/react-router";
import { useRadio } from "@/lib/radio-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const { settings } = useRadio();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("logo_url, navigation_menu").limit(1).maybeSingle();
      return data;
    }
  });

  const nav = (siteSettings?.navigation_menu as any[]) || [];

  return (
    <footer className="gradient-deep text-white/80 mt-20 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-1">
            <div className="font-display text-3xl text-white font-bold leading-none">
              {siteSettings?.logo_url ? (
                <img src={siteSettings.logo_url} alt="Logo" className="h-12 w-auto object-contain filter brightness-0 invert" />
              ) : (
                <>
                  Rádio<span className="text-gold italic">Gospel</span>
                </>
              )}
            </div>
            <p className="text-sm mt-4 text-white/60 leading-relaxed max-w-xs">
              {settings?.tagline ?? "Levando a palavra de Deus e o melhor do louvor para o seu coração, 24 horas por dia."}
            </p>
          </div>
          
          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">Menu Principal</h4>
            <ul className="space-y-4 text-sm">
              {nav.length > 0 ? (
                nav.map((item: any, idx: number) => (
                  <li key={idx}>
                    <Link to={item.to} className="hover:text-gold transition-colors block py-1">{item.label}</Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/" className="hover:text-gold transition-colors block py-1">Início</Link></li>
                  <li><Link to="/programacao" className="hover:text-gold transition-colors block py-1">Programação Ao Vivo</Link></li>
                  <li><Link to="/categoria/noticias" className="hover:text-gold transition-colors block py-1">Portal de Notícias</Link></li>
                </>
              )}
              <li><Link to="/login" className="hover:text-gold transition-colors block py-1">Acesso Administrativo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">Categorias</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/categoria/musica" className="hover:text-gold transition-colors block py-1">Lançamentos Musicais</Link></li>
              <li><Link to="/categoria/eventos" className="hover:text-gold transition-colors block py-1">Eventos e Shows</Link></li>
              <li><Link to="/categoria/devocional" className="hover:text-gold transition-colors block py-1">Mensagens de Fé</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-xs uppercase tracking-[0.2em] mb-6">Fale Conosco</h4>
            {settings?.whatsapp && (
              <a 
                href={`https://wa.me/${settings.whatsapp}`} 
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
          <div>© {new Date().getFullYear()} {settings?.station_name ?? "Rádio Gospel"}.</div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Termos de Uso</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
