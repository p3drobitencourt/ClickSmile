package projetosSpringcom.example.ClickSmile.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/internal")
public class ClientErrorController {

    private static final Logger log = LoggerFactory.getLogger(ClientErrorController.class);
    private static final Path LOG_DIR = Path.of("logs");
    private static final Path LOG_FILE = LOG_DIR.resolve("client-errors.log");

    @PostMapping("/client-error")
    public ResponseEntity<String> receiveClientError(@RequestBody String payload) {
        try {
            Files.createDirectories(LOG_DIR);
            String entry = String.format("%s - %s%n", Instant.now().toString(), payload);
            Files.writeString(LOG_FILE, entry, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            log.info("Client error logged: {}", payload);
            return ResponseEntity.ok("logged");
        } catch (IOException e) {
            log.error("Failed to write client error log", e);
            return ResponseEntity.status(500).body("failed");
        }
    }
}
