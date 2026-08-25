package projetosSpringcom.example.ClickSmile.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseIntegrationTest {

    public static final PostgreSQLContainer<?> postgresDB = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("clicksmile_test")
            .withUsername("postgres")
            .withPassword("postgres")
            .withInitScript("test-init.sql");

    static {
        postgresDB.start();
    }

    @DynamicPropertySource
    public static void properties(DynamicPropertyRegistry registry) {
        // Application runtime connection (Restricted user)
        registry.add("spring.datasource.url", postgresDB::getJdbcUrl);
        registry.add("spring.datasource.username", () -> "clicksmile_app");
        registry.add("spring.datasource.password", () -> "testpassword");
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

        // Flyway migration connection (Superuser)
        registry.add("spring.flyway.url", postgresDB::getJdbcUrl);
        registry.add("spring.flyway.user", postgresDB::getUsername); // postgres
        registry.add("spring.flyway.password", postgresDB::getPassword); // postgres
        registry.add("spring.flyway.enabled", () -> "true");
        
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }
}
