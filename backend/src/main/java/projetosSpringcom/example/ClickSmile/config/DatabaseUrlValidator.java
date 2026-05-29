package projetosSpringcom.example.ClickSmile.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseUrlValidator {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @PostConstruct
    public void validateUrl() {
        if (datasourceUrl != null && datasourceUrl.contains(".railway.internal")) {
            String port = System.getenv("PORT");
            // If PORT is present, it's very likely running in Render or Heroku, not Railway.
            // Railway also provides PORT, but usually we don't mix Railway internal DB with another PaaS.
            // Wait, if it's running IN Railway, it's fine. If it's running IN Render, it's wrong.
            String renderServiceId = System.getenv("RENDER_SERVICE_ID");
            
            if (renderServiceId != null && !renderServiceId.isEmpty()) {
                throw new IllegalStateException(
                    "\n\n=========================================================\n" +
                    "CRITICAL ERROR: CONFIGURACAO DE BANCO DE DADOS INVALIDA!\n" +
                    "Voce esta rodando o Backend no RENDER, mas configurou a \n" +
                    "URL do banco de dados com uma rede interna do RAILWAY:\n" +
                    "Url atual: " + datasourceUrl + "\n" +
                    "Dominios '.railway.internal' so funcionam DENTRO do Railway.\n" +
                    "Para conectar o Render ao banco do Railway, voce precisa ir \n" +
                    "no painel do Railway e copiar a URL DE CONEXAO EXTERNA \n" +
                    "(Ex: jdbc:postgresql://viaduct.proxy.rlwy.net:12345/railway).\n" +
                    "Altere a variavel SPRING_DATASOURCE_URL no Render.\n" +
                    "=========================================================\n\n"
                );
            }
        }
    }
}
