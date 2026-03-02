import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { CheckCircle2, Calculator, CreditCard, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const services = [
  "Avaliação Psicológica",
  "Avaliação Neuropsicológica",
  "Avaliação Psicológica + Neuropsicológica",
];

export default function FinanciamentoPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    service: "",
    observations: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to the backend
    const message = `Olá! Gostaria de simular o financiamento.\n\nNome: ${formData.name}\nServiço: ${formData.service}\n${formData.observations ? `Observações: ${formData.observations}` : ""}`;
    window.open(`https://wa.me/5551992809471?text=${encodeURIComponent(message)}`, "_blank");
    toast({
      title: "Solicitação enviada!",
      description: "Em breve entraremos em contato pelo WhatsApp.",
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-foreground mb-6">Financiamento Próprio</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Condições especiais de parcelamento para Avaliação Psicológica e Neuropsicológica.
            </p>
            <p className="text-muted-foreground">
              Sabemos que o investimento em uma avaliação completa pode ser significativo. Por isso, oferecemos opções de financiamento próprio para facilitar seu acesso ao diagnóstico preciso.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Calculator,
                title: "Parcelamento Flexível",
                description: "Divida em até 36 vezes. Extensão em até 60 vezes para protocolos de testes com maior nível de investimento.",
              },
              {
                icon: CreditCard,
                title: "Sem Cartão de Crédito",
                description: "Financiamento direto, sem necessidade de cartão",
              },
              {
                icon: Clock,
                title: "Análise Rápida",
                description: "Resposta sobre a aprovação em até 24 horas",
              },
              {
                icon: Shield,
                title: "Sem Burocracia",
                description: "Processo simplificado e transparente",
              },
            ].map((benefit, index) => (
              <Card key={index} className="text-center border-border/50">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* How it Works */}
            <div>
              <h2 className="text-foreground mb-8">Como Funciona</h2>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Solicite uma Simulação",
                    description: "Preencha o formulário ou entre em contato pelo WhatsApp.",
                  },
                  {
                    step: "2",
                    title: "Análise e Proposta",
                    description: "Nossa equipe analisa e apresenta as opções de parcelamento disponíveis.",
                  },
                  {
                    step: "3",
                    title: "Aprovação",
                    description: "Após acordo, iniciamos o agendamento da sua avaliação.",
                  },
                  {
                    step: "4",
                    title: "Realize a Avaliação",
                    description: "Inicie seu processo de avaliação com pagamento facilitado.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-accent-foreground">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/5 rounded-2xl">
                <h3 className="font-display font-bold mb-4">Serviços Elegíveis</h3>
                <ul className="space-y-2">
                  {services.map((service, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="card-premium p-8">
              <h2 className="text-foreground mb-6">Quero Simular</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(51) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Serviço desejado</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => setFormData({ ...formData, service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações (opcional)</Label>
                  <Textarea
                    id="observations"
                    placeholder="Alguma informação adicional..."
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full btn-gradient rounded-full">
                  Solicitar Simulação
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao enviar, você concorda com nossa{" "}
                  <a href="/politica-de-privacidade" className="underline">
                    Política de Privacidade
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
