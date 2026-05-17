import { Link } from "@tanstack/react-router";
import { useRadio } from "@/lib/radio-context";

export function Footer() {
  const { settings } = useRadio();
  return (
    <footer className="gradient-deep text-white/80 mt-20">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-display text-2xl text-white">{settings?.station_name ?? "Rádio Gospel"}</div>
          <p className="text-sm mt-2 text-white/60">{settings?.tagline}</p>
        </div>
        <div>
          <h4 className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Navegação</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-gold">Início</Link></li>
            <li><Link to="/programacao" className="hover:text-gold">Programação</Link></li>
            <li><Link to="/categoria/noticias" className="hover:text-gold">Notícias</Link></li>
            <li><Link to="/login" className="hover:text-gold">Área restrita</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Contato</h4>
          {settings?.whatsapp && <p className="text-sm">WhatsApp: {settings.whatsapp}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {settings?.station_name ?? "Rádio Gospel"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
