package projetosSpringcom.example.ClickSmile;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void generateHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH_GENERATED_FOR_123456: " + encoder.encode("123456"));
    }
}
