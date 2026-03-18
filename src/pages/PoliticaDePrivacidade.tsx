import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 18 de fevereiro de 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
            <p>
              O Gerenciar Frotas ("nós", "nosso") valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Dados de cadastro:</strong> nome completo, email, telefone/WhatsApp, CNPJ da empresa;</li>
              <li><strong>Dados da frota:</strong> informações de veículos, viagens, abastecimentos, despesas e manutenções;</li>
              <li><strong>Dados de motoristas:</strong> nome, CNH, contato de emergência;</li>
              <li><strong>Dados de clientes:</strong> nome, CPF/CNPJ, endereço, contato;</li>
              <li><strong>Dados de uso:</strong> logs de acesso, navegação e funcionalidades utilizadas;</li>
              <li><strong>Dados financeiros:</strong> informações de assinatura e pagamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Fornecer e manter os serviços da Plataforma;</li>
              <li>Gerenciar sua conta e assinatura;</li>
              <li>Gerar relatórios e análises de frota;</li>
              <li>Enviar comunicações sobre o serviço;</li>
              <li>Garantir a segurança da Plataforma;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Base Legal</h2>
            <p>
              O tratamento de dados pessoais é realizado com base no consentimento do titular, na execução de contrato, no cumprimento de obrigação legal e no legítimo interesse do controlador, conforme aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Compartilhamento de Dados</h2>
            <p>
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Processadores de pagamento:</strong> para gestão de assinaturas;</li>
              <li><strong>Provedores de infraestrutura:</strong> para hospedagem e armazenamento seguro dos dados;</li>
              <li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial.</li>
            </ul>
            <p className="mt-2">
              Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia, controle de acesso e monitoramento contínuo. Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, perda ou alteração.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para cumprir obrigações legais. Após o encerramento da conta, os dados serão eliminados em até 90 dias, exceto quando houver obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Direitos do Titular</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Obter informações sobre o compartilhamento de dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da Plataforma, como manutenção de sessão e preferências do usuário. Não utilizamos cookies de rastreamento publicitário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada periodicamente. Alterações significativas serão comunicadas pela Plataforma. Recomendamos a revisão periódica deste documento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contato e Encarregado (DPO)</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política, entre em contato pelo email:{" "}
              <a href="mailto:trojilio.mga@gmail.com" className="text-primary underline">
                trojilio.mga@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
