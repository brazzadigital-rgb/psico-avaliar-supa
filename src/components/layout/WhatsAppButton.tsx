import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5551992809471?text=Olá! Gostaria de mais informações sobre os serviços do Centro Psicoavaliar."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Fale conosco pelo WhatsApp"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-scale" />
      
      {/* Button */}
      <div className="relative w-16 h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(37,211,102,0.5)]">
        <MessageCircle className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
        
        {/* Ping Effect */}
        <span className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-30" />
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
        <div className="bg-foreground text-background text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-xl">
          Fale conosco
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-foreground rotate-45" />
        </div>
      </div>
    </a>
  );
}
