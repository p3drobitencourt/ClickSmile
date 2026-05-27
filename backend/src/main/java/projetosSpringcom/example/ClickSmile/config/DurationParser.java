package projetosSpringcom.example.ClickSmile.config;

import java.time.Duration;

/**
 * Utilitário para parse de strings de duração no formato simplificado
 * (ex: "15m", "2h", "30d") ou ISO-8601 (ex: "PT15M").
 * Centraliza a lógica que antes era duplicada em JwtService e RefreshTokenService.
 */
public final class DurationParser {

    private DurationParser() {
        // utility class
    }

    /**
     * Converte uma string de duração para {@link Duration}.
     * Formatos suportados: "15m" (minutos), "2h" (horas), "30d" (dias), ou ISO-8601.
     *
     * @param value    a string de duração
     * @param fallback valor de fallback caso o parse falhe
     * @return a Duration parseada ou o fallback
     */
    public static Duration parse(String value, Duration fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            String trimmed = value.trim();
            if (trimmed.endsWith("m")) {
                return Duration.ofMinutes(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
            }
            if (trimmed.endsWith("h")) {
                return Duration.ofHours(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
            }
            if (trimmed.endsWith("d")) {
                return Duration.ofDays(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
            }
            return Duration.parse(trimmed);
        } catch (Exception e) {
            return fallback;
        }
    }
}
