// PLACEHOLDER: revisar com jurídico
import LegalPageLayout, { ULTIMA_ATUALIZACAO } from "@/components/features/legal/LegalPageLayout";

const PoliticaPrivacidade = () => (
  <LegalPageLayout
    title="Política de Privacidade"
    description="Política de Privacidade da plataforma Medway Currículo — como coletamos, utilizamos e protegemos seus dados pessoais conforme a LGPD."
  >
    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
      Política de Privacidade
    </h1>
    <p className="text-sm text-muted-foreground">
      Última atualização: {ULTIMA_ATUALIZACAO}
    </p>

    <p>
      A Medway Educação Médica Ltda. ("Medway") valoriza a privacidade dos
      usuários da plataforma Medway Currículo. Esta Política de Privacidade
      descreve como coletamos, utilizamos, armazenamos e protegemos seus dados
      pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais
      (Lei nº 13.709/2018 — LGPD).
    </p>

    <h2>1. Dados Coletados</h2>
    <p>Coletamos os seguintes dados pessoais:</p>

    <h3>1.1 Dados de Cadastro</h3>
    <ul>
      <li>Nome completo</li>
      <li>Endereço de e-mail</li>
      <li>Telefone</li>
      <li>Estado (UF)</li>
      <li>Faculdade de graduação</li>
      <li>Ano de formatura</li>
      <li>Especialidade desejada</li>
    </ul>

    <h3>1.2 Dados Curriculares</h3>
    <ul>
      <li>Publicações científicas e acadêmicas</li>
      <li>Dados acadêmicos (notas, monitorias, ligas acadêmicas)</li>
      <li>Atividades de prática e serviço social</li>
      <li>Experiências de liderança e organização de eventos</li>
      <li>Perfil de formação e certificações</li>
    </ul>

    <h3>1.3 Dados de Uso</h3>
    <ul>
      <li>Scores calculados pela plataforma</li>
      <li>Histórico de acesso e navegação</li>
    </ul>

    <h3>1.4 Dados Técnicos</h3>
    <ul>
      <li>Endereço IP</li>
      <li>User-agent do navegador</li>
      <li>Cookies de sessão (gerenciados pelo Supabase Auth)</li>
    </ul>

    <h2>2. Finalidade do Tratamento</h2>
    <p>Seus dados pessoais são tratados para as seguintes finalidades:</p>
    <ol>
      <li>
        Criação e manutenção de sua conta na plataforma.
      </li>
      <li>
        Cálculo de scores estimados com base nas regras de instituições de
        residência médica.
      </li>
      <li>
        Geração de análises comparativas (gap analysis) entre seu currículo e os
        critérios de avaliação das instituições.
      </li>
      <li>
        Comunicação sobre atualizações da plataforma e alterações relevantes.
      </li>
      <li>
        Melhoria contínua dos serviços e da experiência do usuário.
      </li>
      <li>
        Cumprimento de obrigações legais e regulatórias.
      </li>
    </ol>

    <h2>3. Base Legal (LGPD)</h2>
    <p>
      O tratamento dos seus dados pessoais tem como base legal principal o{" "}
      <strong>consentimento</strong> (Art. 7, inciso I da LGPD), obtido no
      momento do cadastro por meio da aceitação explícita destes termos e da
      Política de Privacidade.
    </p>
    <p>
      Em determinadas situações, poderemos tratar dados com base em outras
      hipóteses legais previstas na LGPD, como o legítimo interesse (Art. 7, IX)
      para melhoria dos serviços e cumprimento de obrigação legal (Art. 7, II).
    </p>

    <h2>4. Compartilhamento de Dados</h2>
    <p>
      Seus dados pessoais não são compartilhados com terceiros, exceto nas
      seguintes situações:
    </p>
    <ul>
      <li>
        <strong>Provedores de infraestrutura:</strong> utilizamos o Supabase
        para autenticação e armazenamento de dados, com servidores protegidos e
        em conformidade com padrões internacionais de segurança.
      </li>
      <li>
        <strong>Obrigação legal:</strong> quando exigido por lei, regulamento ou
        ordem judicial.
      </li>
      <li>
        <strong>Consentimento:</strong> quando o Usuário autorizar expressamente
        o compartilhamento.
      </li>
    </ul>

    <h2>5. Armazenamento e Segurança</h2>
    <p>
      Adotamos medidas técnicas e organizacionais adequadas para proteger seus
      dados pessoais contra acesso não autorizado, perda, destruição ou
      alteração, incluindo:
    </p>
    <ul>
      <li>Criptografia de dados em trânsito (HTTPS/TLS).</li>
      <li>Autenticação segura com gerenciamento de sessões.</li>
      <li>
        Políticas de acesso restrito (Row Level Security) no banco de dados.
      </li>
      <li>Backups regulares e monitoramento de segurança.</li>
    </ul>

    <h2>6. Direitos do Titular</h2>
    <p>
      Em conformidade com o Art. 18 da LGPD, você tem os seguintes direitos em
      relação aos seus dados pessoais:
    </p>
    <ul>
      <li>
        <strong>Acesso:</strong> solicitar informações sobre quais dados pessoais
        seus são tratados.
      </li>
      <li>
        <strong>Correção:</strong> solicitar a correção de dados incompletos,
        inexatos ou desatualizados.
      </li>
      <li>
        <strong>Exclusão:</strong> solicitar a eliminação de seus dados pessoais
        tratados com base em consentimento. A plataforma disponibilizará
        funcionalidade de exclusão de conta diretamente nas configurações do
        usuário.
      </li>
      <li>
        <strong>Portabilidade:</strong> solicitar a transferência de seus dados a
        outro fornecedor de serviço, mediante requisição expressa.
      </li>
      <li>
        <strong>Revogação do consentimento:</strong> retirar o consentimento a
        qualquer momento, sem comprometer a licitude do tratamento realizado
        anteriormente.
      </li>
      <li>
        <strong>Informação:</strong> ser informado sobre as entidades públicas e
        privadas com as quais seus dados são compartilhados.
      </li>
    </ul>

    <h2>7. Cookies e Tecnologias</h2>
    <p>
      A Plataforma utiliza cookies essenciais para o funcionamento do serviço,
      incluindo:
    </p>
    <ul>
      <li>
        <strong>Cookies de sessão:</strong> gerenciados pelo Supabase Auth para
        manter sua autenticação ativa.
      </li>
    </ul>
    <p>
      Não utilizamos cookies de rastreamento de terceiros ou para fins
      publicitários.
    </p>

    <h2>8. Retenção de Dados</h2>
    <p>
      Seus dados pessoais são mantidos enquanto sua conta estiver ativa na
      Plataforma. Após a exclusão da conta, seus dados serão eliminados no prazo
      de até 30 dias, exceto quando houver obrigação legal de retenção.
    </p>

    <h2>9. Alterações nesta Política</h2>
    <p>
      Esta Política de Privacidade poderá ser atualizada periodicamente. As
      alterações entrarão em vigor na data de sua publicação na Plataforma.
      Notificaremos o Usuário sobre alterações relevantes por meio do e-mail
      cadastrado ou aviso na Plataforma.
    </p>

    <h2>10. Contato do Encarregado (DPO)</h2>
    <p>
      Para exercer seus direitos como titular de dados ou esclarecer dúvidas
      sobre o tratamento de seus dados pessoais, entre em contato com nosso
      Encarregado de Proteção de Dados (DPO):
    </p>
    <p>
      <strong>Medway Educação Médica Ltda.</strong>
      <br />
      E-mail: privacidade@medway.com.br
    </p>
  </LegalPageLayout>
);

export default PoliticaPrivacidade;
