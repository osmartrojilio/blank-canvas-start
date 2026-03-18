import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermosDeUso() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 18 de fevereiro de 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Gerenciar Frotas ("Plataforma"), você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição aqui prevista, solicitamos que não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
            <p>
              O Gerenciar Frotas é uma plataforma de gestão de frotas que oferece funcionalidades como controle de veículos, viagens, abastecimentos, despesas, manutenções, relatórios e gestão de motoristas, destinada a transportadoras e empresas com frota própria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta</h2>
            <p>
              Para utilizar a Plataforma, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Planos e Pagamentos</h2>
            <p>
              A Plataforma oferece diferentes planos de assinatura. Os valores, funcionalidades e limites de cada plano estão descritos na página de planos. O pagamento é recorrente e pode ser cancelado a qualquer momento, encerrando o acesso ao final do período contratado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Uso Adequado</h2>
            <p>O usuário compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Utilizar a Plataforma apenas para fins lícitos e relacionados à gestão de frotas;</li>
              <li>Não tentar acessar áreas restritas ou dados de outros usuários;</li>
              <li>Não reproduzir, copiar ou redistribuir o conteúdo da Plataforma sem autorização;</li>
              <li>Não realizar engenharia reversa ou interferir no funcionamento do sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma, incluindo logotipos, textos, gráficos, interfaces e software, é de propriedade exclusiva do Gerenciar Frotas ou de seus licenciadores, protegido pelas leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disponibilidade do Serviço</h2>
            <p>
              Nos empenhamos para manter a Plataforma disponível de forma ininterrupta, porém não garantimos disponibilidade contínua. Manutenções programadas ou emergenciais podem causar interrupções temporárias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
            <p>
              O Gerenciar Frotas não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso da Plataforma, incluindo perda de dados ou lucros cessantes, exceto nos casos previstos em lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta caso haja violação destes Termos. Você pode encerrar sua conta a qualquer momento através das configurações da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por meio da Plataforma. O uso continuado após as alterações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer litígio será submetido ao foro da comarca da sede do Gerenciar Frotas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos, entre em contato pelo email:{" "}
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
