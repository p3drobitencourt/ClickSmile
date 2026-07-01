package projetosSpringcom.example.ClickSmile.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;

import java.util.HashMap;
import java.util.Map;

public class RailwayDatabaseEnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl != null && databaseUrl.startsWith("postgresql://")) {
            // Convert postgresql://user:pass@host:port/db to jdbc:postgresql://host:port/db
            try {
                String cleanUrl = databaseUrl.replace("postgresql://", "");
                String[] parts = cleanUrl.split("@");
                String credentials = parts[0];
                String hostPortDb = parts[1];

                String[] credParts = credentials.split(":");
                String username = credParts[0];
                String password = credParts[1];

                String jdbcUrl = "jdbc:postgresql://" + hostPortDb;

                Map<String, Object> map = new HashMap<>();
                map.put("spring.datasource.url", jdbcUrl);
                map.put("spring.datasource.username", username);
                map.put("spring.datasource.password", password);

                PropertySource<?> propertySource = new MapPropertySource("railwayDatabaseProperties", map);
                MutablePropertySources propertySources = environment.getPropertySources();
                propertySources.addFirst(propertySource);
            } catch (Exception e) {
                // Ignore parse errors, let Spring Boot use default properties
            }
        }
    }
}
