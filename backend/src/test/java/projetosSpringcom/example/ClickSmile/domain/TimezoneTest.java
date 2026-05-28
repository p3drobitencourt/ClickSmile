package projetosSpringcom.example.ClickSmile.domain;

import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class TimezoneTest {

    @Test
    public void testOffsetDateTimeConversionToUTC() {
        // Simulating an Angular request sending datetime in Brasilia Time (-03:00)
        String angularPayloadIso = "2026-10-10T10:00:00-03:00";
        OffsetDateTime brazilTime = OffsetDateTime.parse(angularPayloadIso);

        // The JVM and DB should normalize this to UTC (+00:00) behind the scenes
        // 10:00 AM at -03:00 is 13:00 PM at UTC
        OffsetDateTime utcTime = brazilTime.withOffsetSameInstant(ZoneOffset.UTC);

        assertEquals(13, utcTime.getHour());
        assertEquals("-03:00", brazilTime.getOffset().toString());
        assertEquals("Z", utcTime.getOffset().toString());
    }
}
