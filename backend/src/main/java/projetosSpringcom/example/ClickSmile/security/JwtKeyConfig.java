package projetosSpringcom.example.ClickSmile.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtKeyConfig {

    @Value("${app.security.jwt.private-key-path:}")
    private String privateKeyPath;

    @Value("${app.security.jwt.public-key-path:}")
    private String publicKeyPath;

    @Bean
    public KeyPair rsaKeyPair() throws Exception {
        RSAPublicKey publicKey = null;
        RSAPrivateKey privateKey = null;

        // try load from filesystem or classpath if configured
        if (privateKeyPath != null && !privateKeyPath.isBlank() && publicKeyPath != null && !publicKeyPath.isBlank()) {
            try {
                byte[] priv = loadPem(privateKeyPath);
                byte[] pub = loadPem(publicKeyPath);
                KeyFactory kf = KeyFactory.getInstance("RSA");
                privateKey = (RSAPrivateKey) kf.generatePrivate(new PKCS8EncodedKeySpec(priv));
                publicKey = (RSAPublicKey) kf.generatePublic(new X509EncodedKeySpec(pub));
                return new KeyPair(publicKey, privateKey);
            } catch (Exception ignored) {
                // fallback to generation
            }
        }

        // generate ephemeral keypair
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private byte[] loadPem(String pathStr) throws IOException {
        Path p = Path.of(pathStr);
        String raw;
        if (Files.exists(p)) {
            raw = Files.readString(p);
        } else {
            // try classpath resource
            var is = getClass().getClassLoader().getResourceAsStream(pathStr.replaceFirst("classpath:", ""));
            if (is == null) throw new IOException("Key resource not found: " + pathStr);
            raw = new String(is.readAllBytes());
        }

        raw = raw.replaceAll("-----BEGIN [A-Z ]+-----", "");
        raw = raw.replaceAll("-----END [A-Z ]+-----", "");
        raw = raw.replaceAll("\\s", "");
        return Base64.getDecoder().decode(raw);
    }

    @Bean
    public RSAPublicKey rsaPublicKey(KeyPair keyPair) {
        return (RSAPublicKey) keyPair.getPublic();
    }

    @Bean
    public RSAPrivateKey rsaPrivateKey(KeyPair keyPair) {
        return (RSAPrivateKey) keyPair.getPrivate();
    }
}
