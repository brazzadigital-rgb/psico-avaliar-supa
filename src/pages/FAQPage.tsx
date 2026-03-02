import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Star } from "lucide-react";

const faqs = [
  {
    category: "Avaliação",
    questions: [
      {
        question: "O que é a avaliação psicológica e neuropsicológica?",
        answer: "A avaliação psicológica e neuropsicológica é um processo que utiliza entrevistas, observações e testes padronizados para investigar aspectos cognitivos, emocionais e comportamentais. É fundamental para diagnóstico de condições como TEA, TDAH, dificuldades de aprendizagem, entre outras.",
      },
      {
        question: "Qual o prazo para receber o laudo?",
        answer: "O laudo é entregue em até 30 dias após a conclusão das sessões de avaliação. Casos de urgência podem ser negociados diretamente com a equipe.",
      },
      {
        question: "A avaliação pode ser feita online?",
        answer: "Algumas etapas da avaliação podem ser realizadas online, mas determinados testes exigem aplicação presencial. A equipe avalia cada caso e orienta sobre a melhor modalidade.",
      },
      {
        question: "A partir de que idade é possível realizar a avaliação?",
        answer: "Realizamos avaliações a partir de 4 anos de idade, com instrumentos e abordagens adequadas para cada faixa etária.",
      },
    ],
  },
  {
    category: "Atendimento",
    questions: [
      {
        question: "Como funciona a primeira consulta?",
        answer: "A primeira consulta é uma triagem onde conhecemos sua história, entendemos suas necessidades e direcionamos para o serviço mais adequado. É um momento de acolhimento e escuta.",
      },
      {
        question: "Vocês atendem crianças?",
        answer: "Sim, temos equipe especializada em atendimento infantil, com abordagem lúdica e adequada para cada idade. Atendemos a partir de 4 anos.",
      },
      {
        question: "O atendimento é presencial ou online?",
        answer: "Oferecemos ambas as modalidades. O atendimento presencial é realizado em nosso consultório em Porto Alegre (Vila Nova), e o online está disponível para todo o Brasil e exterior.",
      },
      {
        question: "Como funciona o atendimento online?",
        answer: "O atendimento online é realizado por videoconferência em plataforma segura. Você recebe o link antes da sessão. É necessário ter um ambiente reservado e conexão estável de internet.",
      },
    ],
  },
  {
    category: "Pagamento",
    questions: [
      {
        question: "Quais são as formas de pagamento?",
        answer: "Aceitamos Pix, transferência bancária, cartão de crédito/débito e oferecemos financiamento próprio para avaliações psicológicas e neuropsicológicas.",
      },
      {
        question: "Como funciona o financiamento próprio?",
        answer: "O financiamento próprio permite parcelar o valor da avaliação sem necessidade de cartão de crédito. Solicite uma simulação pelo WhatsApp ou formulário.",
      },
      {
        question: "Vocês atendem por convênio?",
        answer: "Atualmente atendemos apenas particular. Porém, oferecemos planos de assinatura e financiamento próprio para tornar o tratamento mais acessível.",
      },
      {
        question: "Emitem nota fiscal?",
        answer: "Sim, emitimos nota fiscal de todos os serviços prestados.",
      },
    ],
  },
  {
    category: "Cancelamento",
    questions: [
      {
        question: "Posso cancelar ou remarcar uma consulta?",
        answer: "Sim, solicitamos que o cancelamento ou remarcação seja feito com pelo menos 24 horas de antecedência.",
      },
      {
        question: "O que acontece se eu não comparecer?",
        answer: "Faltas não comunicadas com antecedência podem ser cobradas. Em caso de imprevistos, entre em contato o mais rápido possível.",
      },
    ],
  },
  {
    category: "Confidencialidade",
    questions: [
      {
        question: "As informações são confidenciais?",
        answer: "Sim, todo o atendimento é sigiloso e segue as normas do Código de Ética do Psicólogo. Informações só são compartilhadas com autorização expressa ou por determinação legal.",
      },
      {
        question: "Vocês enviam relatórios para a escola?",
        answer: "Com autorização dos responsáveis, podemos enviar relatórios ou orientações para a escola, sempre respeitando o sigilo profissional.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Tire suas dúvidas
            </span>
            <h1 className="text-foreground mb-6 animate-fade-in">
              Perguntas Frequentes
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Encontre respostas para as principais dúvidas sobre nossos serviços, formas de pagamento e agendamento.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="section-padding">
        <div className="container-narrow">
          {faqs.map((category, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6 text-foreground flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </span>
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`${index}-${i}`}
                    className="card-premium px-6 border-none"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-5 text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        
        <div className="container-narrow relative z-10 text-center">
          <h2 className="text-white mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Nossa equipe está pronta para esclarecer qualquer questão
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/5551992809471?text=Olá! Tenho uma dúvida."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105"
            >
              Falar pelo WhatsApp
            </a>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all"
            >
              Formulário de Contato
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
