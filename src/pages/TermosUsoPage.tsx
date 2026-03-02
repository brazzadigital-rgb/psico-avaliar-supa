import { Layout } from "@/components/layout";

export default function TermosUsoPage() {
  return (
    <Layout>
      <div className="container-wide py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8">Termos de Uso</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Última atualização: Janeiro de 2025
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o site do Centro de Psicologia Psicoavaliar, você concorda 
              com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, 
              não utilize nosso site.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">2. Descrição dos Serviços</h2>
            <p>
              O Psicoavaliar oferece serviços de:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Avaliação psicológica e neuropsicológica</li>
              <li>Psicoterapia individual (infantil, adolescente e adulto)</li>
              <li>Terapia ABA para TEA</li>
              <li>Atendimento psiquiátrico</li>
              <li>Psicopedagogia</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">3. Agendamento Online</h2>
            <p>
              Ao realizar um agendamento através do nosso site:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Você declara que as informações fornecidas são verdadeiras e completas</li>
              <li>Compromete-se a comparecer no horário agendado ou comunicar cancelamento com antecedência mínima de 24 horas</li>
              <li>Autoriza o envio de lembretes por e-mail e/ou WhatsApp</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">4. Cancelamentos e Remarcações</h2>
            <p>
              Cancelamentos ou remarcações devem ser comunicados com pelo menos 24 horas de 
              antecedência. Faltas sem aviso prévio podem estar sujeitas à cobrança de taxa 
              administrativa, conforme política informada no momento do agendamento.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">5. Sigilo Profissional</h2>
            <p>
              Todos os atendimentos são protegidos pelo sigilo profissional, conforme previsto 
              no Código de Ética Profissional do Psicólogo e legislação aplicável.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">6. Limitações de Uso</h2>
            <p>É proibido:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Usar o site para fins ilegais ou não autorizados</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Reproduzir conteúdo do site sem autorização</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site, incluindo textos, imagens, logos e design, é de 
              propriedade do Psicoavaliar e protegido por direitos autorais.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">8. Isenção de Responsabilidade</h2>
            <p>
              O conteúdo informativo do site não substitui consulta profissional. Em caso de 
              emergência ou crise, procure atendimento presencial imediato ou ligue para 
              serviços de emergência.
            </p>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl my-6">
              <p className="font-semibold text-destructive">⚠️ Importante</p>
              <p className="text-sm mt-2">
                Este site não oferece atendimento de emergência. Em caso de crise ou risco de vida, 
                procure o SAMU (192), CVV (188) ou vá ao pronto-socorro mais próximo.
              </p>
            </div>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">9. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
              entram em vigor imediatamente após sua publicação no site.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">10. Contato</h2>
            <p>
              Para dúvidas sobre estes termos:
            </p>
            <ul className="list-none mb-4">
              <li><strong>E-mail:</strong> centropsicoavaliar@gmail.com</li>
              <li><strong>Telefone:</strong> (51) 99280-9471</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">11. Foro</h2>
            <p>
              Fica eleito o foro da Comarca de Porto Alegre/RS para dirimir quaisquer questões 
              oriundas destes Termos de Uso.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
