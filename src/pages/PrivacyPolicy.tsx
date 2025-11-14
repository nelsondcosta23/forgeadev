import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/" className="text-primary hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Política de Privacidade</h1>
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <p className="text-foreground font-medium">
            🔒 Os seus dados são processados de forma segura e não são partilhados com terceiros. Apenas guardamos as suas respostas anonimamente para melhorar as recomendações.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Introdução</h2>
            <p>
              Esta Política de Privacidade explica como tratamos as suas informações quando usa a nossa aplicação de quiz. Valorizamos a sua privacidade e recolhemos apenas os dados necessários para operar e melhorar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Informação Que Recolhemos</h2>
            <p>
              Recolhemos informação mínima, especificamente:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>País de origem, para gerar estatísticas de uso anónimas</li>
            </ul>
            <p className="mt-4">
              Não recolhemos nomes, e-mails ou quaisquer dados de identificação pessoal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Como Usamos Esta Informação</h2>
            <p>
              Usamos esta informação apenas para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Compreender de onde vêm os nossos utilizadores (estatísticas ao nível do país)</li>
              <li>Melhorar e otimizar a experiência do quiz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Segurança de Dados</h2>
            <p>
              Utilizamos medidas de segurança padrão para proteger os dados e garantir que nenhuma informação pessoal é exposta ou mal utilizada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Serviços de Terceiros</h2>
            <p>
              Podemos usar ferramentas de terceiros (por exemplo, fornecedores de análise) que recebem informação técnica anonimizada, como tipo de navegador ou dispositivo, para nos ajudar a compreender como os utilizadores interagem com o site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Os Seus Direitos</h2>
            <p>
              Pode contactar-nos se desejar solicitar informações sobre o tratamento ou eliminação de dados. Como não armazenamos dados pessoais identificáveis, geralmente não há nada para eliminar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Alterações a Esta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade ocasionalmente. As atualizações serão publicadas nesta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contacto</h2>
            <p>
              Se tiver alguma questão, entre em contacto através do nosso website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
