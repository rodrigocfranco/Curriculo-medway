// PLACEHOLDER: revisar com jurídico
import LegalPageLayout, { ULTIMA_ATUALIZACAO } from "@/components/features/legal/LegalPageLayout";

const TermosDeUso = () => (
  <LegalPageLayout
    title="Termos de Uso"
    description="Termos de Uso da plataforma Medway Currículo — condições de uso, responsabilidades e direitos do usuário."
  >
    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
      Termos de Uso
    </h1>
    <p className="text-sm text-muted-foreground">
      Última atualização: {ULTIMA_ATUALIZACAO}
    </p>

    <h2>1. Definições</h2>
    <p>
      Para fins destes Termos de Uso, consideram-se as seguintes definições:
    </p>
    <ul>
      <li>
        <strong>Plataforma:</strong> o aplicativo web "Medway Currículo",
        disponibilizado pela Medway Educação Médica Ltda.
      </li>
      <li>
        <strong>Usuário:</strong> toda pessoa física que se cadastra e utiliza a
        Plataforma.
      </li>
      <li>
        <strong>Conteúdo:</strong> informações, textos, dados e materiais
        disponibilizados na Plataforma.
      </li>
      <li>
        <strong>Score:</strong> pontuação estimada gerada pela Plataforma com
        base nas informações fornecidas pelo Usuário e nas regras de cada
        instituição de residência médica.
      </li>
    </ul>

    <h2>2. Aceitação dos Termos</h2>
    <p>
      Ao acessar ou utilizar a Plataforma, o Usuário declara ter lido,
      compreendido e aceitado integralmente estes Termos de Uso. Caso não
      concorde com qualquer disposição, o Usuário deverá cessar imediatamente o
      uso da Plataforma.
    </p>
    <p>
      O uso continuado da Plataforma após eventuais alterações nestes Termos
      constitui aceitação das modificações.
    </p>

    <h2>3. Cadastro e Conta</h2>
    <p>
      Para utilizar a Plataforma, o Usuário deverá criar uma conta fornecendo
      informações verdadeiras, completas e atualizadas. O Usuário é responsável
      por:
    </p>
    <ul>
      <li>Manter a confidencialidade de suas credenciais de acesso.</li>
      <li>
        Todas as atividades realizadas em sua conta, incluindo aquelas
        realizadas por terceiros com acesso às suas credenciais.
      </li>
      <li>
        Notificar imediatamente a Medway Educação Médica sobre qualquer uso não
        autorizado de sua conta.
      </li>
    </ul>
    <p>
      A Medway Educação Médica reserva-se o direito de suspender ou encerrar
      contas que violem estes Termos.
    </p>

    <h2>4. Uso da Plataforma</h2>
    <p>A Plataforma destina-se exclusivamente a:</p>
    <ol>
      <li>
        Preenchimento de informações curriculares relevantes para processos
        seletivos de residência médica.
      </li>
      <li>
        Geração de scores estimados com base nas regras oficiais de instituições
        de residência médica.
      </li>
      <li>
        Análise comparativa (gap analysis) entre o currículo do Usuário e os
        critérios de avaliação das instituições.
      </li>
    </ol>
    <p>O Usuário compromete-se a não:</p>
    <ul>
      <li>Fornecer informações falsas ou enganosas.</li>
      <li>
        Utilizar a Plataforma para fins ilegais ou não autorizados.
      </li>
      <li>
        Tentar acessar áreas restritas da Plataforma ou de seus sistemas.
      </li>
      <li>
        Reproduzir, copiar ou distribuir o conteúdo da Plataforma sem
        autorização prévia.
      </li>
    </ul>

    <h2>5. Propriedade Intelectual</h2>
    <p>
      Todo o conteúdo da Plataforma, incluindo mas não se limitando a textos,
      gráficos, logotipos, ícones, imagens, código-fonte e software, é de
      propriedade da Medway Educação Médica ou de seus licenciadores e está
      protegido pelas leis brasileiras de propriedade intelectual.
    </p>
    <p>
      Os scores e análises gerados pela Plataforma são estimativas baseadas em
      informações públicas sobre regras de instituições de residência médica e
      nos dados fornecidos pelo Usuário. Tais scores não constituem garantia de
      classificação ou aprovação em qualquer processo seletivo.
    </p>

    <h2>6. Limitação de Responsabilidade</h2>
    <p>
      A Medway Educação Médica não se responsabiliza por:
    </p>
    <ul>
      <li>
        Decisões tomadas pelo Usuário com base nos scores ou análises gerados
        pela Plataforma.
      </li>
      <li>
        Alterações nas regras de instituições de residência médica que possam
        afetar a precisão dos scores.
      </li>
      <li>
        Indisponibilidade temporária da Plataforma por motivos técnicos ou de
        manutenção.
      </li>
      <li>
        Danos indiretos, incidentais ou consequenciais decorrentes do uso da
        Plataforma.
      </li>
    </ul>
    <p>
      Os scores apresentados são estimativas e não substituem a consulta direta
      aos editais e regulamentos oficiais de cada instituição.
    </p>

    <h2>7. Modificação dos Termos</h2>
    <p>
      A Medway Educação Médica reserva-se o direito de modificar estes Termos de
      Uso a qualquer momento. As alterações entrarão em vigor na data de sua
      publicação na Plataforma. O Usuário será notificado sobre alterações
      relevantes por meio do e-mail cadastrado ou por aviso na Plataforma.
    </p>

    <h2>8. Lei Aplicável e Foro</h2>
    <p>
      Estes Termos de Uso são regidos pelas leis da República Federativa do
      Brasil. Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo,
      para dirimir quaisquer controvérsias decorrentes destes Termos, com
      renúncia expressa a qualquer outro, por mais privilegiado que seja.
    </p>

    <h2>9. Contato</h2>
    <p>
      Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso, o
      Usuário poderá entrar em contato conosco pelo e-mail:
    </p>
    <p>
      <strong>Medway Educação Médica Ltda.</strong>
      <br />
      E-mail: contato@medway.com.br
    </p>
  </LegalPageLayout>
);

export default TermosDeUso;
