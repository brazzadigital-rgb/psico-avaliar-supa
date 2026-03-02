import { Layout } from "@/components/layout";

export default function PoliticaPrivacidadePage() {
  return (
    <Layout>
      <div className="container-wide py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8">Política de Privacidade</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Última atualização: Janeiro de 2025
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">1. Introdução</h2>
            <p>
              O Centro de Psicologia Psicoavaliar ("nós", "nosso" ou "Psicoavaliar") está comprometido 
              em proteger a privacidade e os dados pessoais de nossos pacientes e visitantes, em 
              conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc ml-6 mb-4">
              <li><strong>Dados de identificação:</strong> nome completo, data de nascimento, CPF</li>
              <li><strong>Dados de contato:</strong> e-mail, telefone, endereço</li>
              <li><strong>Dados de saúde:</strong> histórico clínico, avaliações psicológicas (coletados apenas com consentimento explícito)</li>
              <li><strong>Dados de navegação:</strong> cookies, endereço IP, páginas visitadas</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Prestação de serviços de atendimento psicológico</li>
              <li>Agendamento de consultas e comunicação sobre atendimentos</li>
              <li>Emissão de laudos e relatórios quando solicitados</li>
              <li>Cumprimento de obrigações legais e éticas da profissão</li>
              <li>Melhoria dos nossos serviços e experiência do usuário</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">4. Base Legal</h2>
            <p>
              O tratamento de dados pessoais é realizado com base no consentimento do titular, 
              execução de contrato, cumprimento de obrigação legal e interesse legítimo, 
              conforme aplicável a cada situação.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">5. Compartilhamento de Dados</h2>
            <p>
              Não compartilhamos dados pessoais com terceiros, exceto quando necessário para:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Cumprimento de obrigação legal ou ordem judicial</li>
              <li>Proteção da vida ou da integridade física do titular ou de terceiros</li>
              <li>Com autorização expressa do titular</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">6. Segurança dos Dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais 
              contra acessos não autorizados, destruição, perda, alteração ou qualquer forma de 
              tratamento inadequado.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">7. Seus Direitos</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a portabilidade dos dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a eliminação dos dados (quando aplicável)</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">8. Retenção de Dados</h2>
            <p>
              Os dados pessoais são armazenados pelo período necessário para cumprir as finalidades 
              para as quais foram coletados, respeitando os prazos legais aplicáveis, especialmente 
              os previstos pelo Conselho Federal de Psicologia.
            </p>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">9. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <ul className="list-none mb-4">
              <li><strong>E-mail:</strong> centropsicoavaliar@gmail.com</li>
              <li><strong>Telefone:</strong> (51) 99280-9471</li>
              <li><strong>Endereço:</strong> Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS</li>
            </ul>

            <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">10. Alterações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Recomendamos que você consulte 
              esta página regularmente para estar ciente de quaisquer alterações.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
