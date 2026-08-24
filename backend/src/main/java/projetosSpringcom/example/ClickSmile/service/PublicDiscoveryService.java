package projetosSpringcom.example.ClickSmile.service;

import org.springframework.stereotype.Service;
import projetosSpringcom.example.ClickSmile.repository.PublicDiscoveryRepository;
import projetosSpringcom.example.ClickSmile.dto.DentistaResumoDTO;
import projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO;
import java.util.*;
import java.time.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import projetosSpringcom.example.ClickSmile.dto.RegraHorarioDTO;
import projetosSpringcom.example.ClickSmile.domain.StatusAgendamento;
import java.sql.Timestamp;
import java.math.BigDecimal;

@Service
public class PublicDiscoveryService {

    private final PublicDiscoveryRepository publicRepository;
    private final ObjectMapper objectMapper;

    public PublicDiscoveryService(PublicDiscoveryRepository publicRepository, ObjectMapper objectMapper) {
        this.publicRepository = publicRepository;
        this.objectMapper = objectMapper;
    }

    public List<DentistaResumoDTO> buscarDentistas(Double lat, Double lng) {
        List<Map<String, Object>> rows;
        if (lat != null && lng != null) {
            double radiusKm = 30.0;
            double latDelta = radiusKm / 111.045;
            double lngDelta = radiusKm / (111.045 * Math.cos(Math.toRadians(lat)));

            double latMin = lat - latDelta;
            double latMax = lat + latDelta;
            double lngMin = lng - lngDelta;
            double lngMax = lng + lngDelta;
            
            rows = publicRepository.findDentistasProximos(lat, lng, latMin, latMax, lngMin, lngMax);
        } else {
            rows = publicRepository.findAllDentistasComLocalizacao();
        }

        if (rows.isEmpty()) {
            return List.of();
        }

        List<UUID> dentistaIds = rows.stream()
                .map(row -> UUID.fromString(row.get("dentista_id").toString()))
                .toList();

        // Anti N+1: Buscar agendas em lote
        List<Map<String, Object>> agendasRows = publicRepository.findAgendasByDentistas(dentistaIds);
        Map<UUID, Map<String, Object>> agendaMap = new HashMap<>();
        for (Map<String, Object> a : agendasRows) {
            agendaMap.put(UUID.fromString(a.get("dentista_usuario_id").toString()), a);
        }

        // Anti N+1: Buscar agendamentos em lote
        LocalDate hoje = LocalDate.now();
        LocalDate seteDias = hoje.plusDays(7);
        Timestamp inicioTs = Timestamp.valueOf(hoje.atStartOfDay());
        Timestamp fimTs = Timestamp.valueOf(seteDias.plusDays(1).atStartOfDay());
        
        List<Map<String, Object>> agendamentosRows = publicRepository.findAgendamentosByDentistasAndDataRange(dentistaIds, inicioTs, fimTs);
        Map<UUID, List<Map<String, Object>>> agendamentosPorDentista = new HashMap<>();
        for (Map<String, Object> ag : agendamentosRows) {
            UUID dId = UUID.fromString(ag.get("dentista_id").toString());
            agendamentosPorDentista.computeIfAbsent(dId, k -> new ArrayList<>()).add(ag);
        }

        // Montar a resposta final
        List<DentistaResumoDTO> resultado = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            UUID dentistaId = UUID.fromString(row.get("dentista_id").toString());
            String nome = (String) row.get("nome");
            String email = (String) row.get("email");
            String cro = (String) row.get("cro");
            String especialidade = (String) row.get("especialidade");
            BigDecimal latitude = row.get("latitude") != null ? new BigDecimal(row.get("latitude").toString()) : null;
            BigDecimal longitude = row.get("longitude") != null ? new BigDecimal(row.get("longitude").toString()) : null;
            Double distanciaKm = row.get("distanciaKm") != null ? ((Number) row.get("distanciaKm")).doubleValue() : null;

            Map<String, Object> agenda = agendaMap.get(dentistaId);
            String agendaInfo = "Não configurado";
            List<SlotResponseDTO> slots = new ArrayList<>();

            if (agenda != null) {
                Integer slotDuration = (Integer) agenda.get("slot_duration_min");
                agendaInfo = slotDuration + " min";
                slots = calcularSlots(agenda, agendamentosPorDentista.getOrDefault(dentistaId, List.of()), hoje, seteDias);
            }

            resultado.add(new DentistaResumoDTO(
                    dentistaId, nome, email, cro, especialidade,
                    agendaInfo, latitude, longitude, distanciaKm, slots
            ));
        }

        return resultado;
    }

    private List<SlotResponseDTO> calcularSlots(Map<String, Object> agenda, List<Map<String, Object>> agendamentos, LocalDate inicio, LocalDate fim) {
        List<SlotResponseDTO> slots = new ArrayList<>();
        try {
            String regrasJson = (String) agenda.get("regra_semana");
            List<RegraHorarioDTO> regras = objectMapper.readValue(regrasJson, new TypeReference<List<RegraHorarioDTO>>() {});
            if (regras == null || regras.isEmpty()) return slots;

            String timezoneStr = (String) agenda.get("timezone");
            ZoneId zone = ZoneId.of(timezoneStr != null ? timezoneStr : "America/Sao_Paulo");
            Integer slotDuration = (Integer) agenda.get("slot_duration_min");
            if (slotDuration == null) slotDuration = 30;

            for (LocalDate date = inicio; !date.isAfter(fim); date = date.plusDays(1)) {
                int dayOfWeek = date.getDayOfWeek().getValue();
                for (RegraHorarioDTO regra : regras) {
                    if (regra.ativo() != null && regra.ativo() && date.getDayOfWeek().name().equalsIgnoreCase(regra.diaSemana())) {
                        LocalTime current = regra.inicio();
                        while (!current.plusMinutes(slotDuration).isAfter(regra.fim())) {
                            OffsetDateTime slotStart = date.atTime(current).atZone(zone).toOffsetDateTime();
                            OffsetDateTime slotEnd = slotStart.plusMinutes(slotDuration);

                            boolean hasConflict = false;

                            if (regra.pausaInicio() != null && regra.pausaFim() != null) {
                                boolean cruzaPausa = current.isBefore(regra.pausaFim()) && current.plusMinutes(slotDuration).isAfter(regra.pausaInicio());
                                if (cruzaPausa) hasConflict = true;
                            }

                            if (!hasConflict) {
                                for (Map<String, Object> ag : agendamentos) {
                                    OffsetDateTime agStart = ((Timestamp) ag.get("data_hora")).toInstant().atZone(zone).toOffsetDateTime();
                                    OffsetDateTime agEnd = agStart.plusMinutes(slotDuration);

                                    if (slotStart.isBefore(agEnd) && slotEnd.isAfter(agStart)) {
                                        hasConflict = true;
                                        break;
                                    }
                                }
                            }
                            if (!hasConflict) {
                                slots.add(new SlotResponseDTO(slotStart, slotEnd));
                            }
                            current = current.plusMinutes(slotDuration);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log warning e retornar lista vazia
            e.printStackTrace();
        }
        return slots;
    }
}
