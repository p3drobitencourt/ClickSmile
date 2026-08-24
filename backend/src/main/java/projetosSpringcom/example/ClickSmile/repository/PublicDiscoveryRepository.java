package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;

@Repository
public class PublicDiscoveryRepository {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public PublicDiscoveryRepository(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    public List<Map<String, Object>> findDentistasProximos(double lat, double lng, double latMin, double latMax, double lngMin, double lngMax) {
        String sql = "SELECT dentista_id, nome, email, cro, especialidade, latitude, longitude, " +
                     "(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(latitude)))) AS distanciaKm " +
                     "FROM public.vw_dentista_publico " +
                     "WHERE latitude BETWEEN :latMin AND :latMax " +
                     "AND longitude BETWEEN :lngMin AND :lngMax " +
                     "ORDER BY distanciaKm ASC";

        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("lat", lat);
        parameters.addValue("lng", lng);
        parameters.addValue("latMin", latMin);
        parameters.addValue("latMax", latMax);
        parameters.addValue("lngMin", lngMin);
        parameters.addValue("lngMax", lngMax);

        return namedParameterJdbcTemplate.queryForList(sql, parameters);
    }

    public List<Map<String, Object>> findAllDentistasComLocalizacao() {
        String sql = "SELECT dentista_id, nome, email, cro, especialidade, latitude, longitude, NULL AS distanciaKm " +
                     "FROM public.vw_dentista_publico";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> findAgendasByDentistas(List<UUID> dentistaIds) {
        if (dentistaIds == null || dentistaIds.isEmpty()) return List.of();
        String sql = "SELECT id, dentista_usuario_id, timezone, slot_duration_min, hora_inicio_padrao, hora_fim_padrao, regra_semana " +
                     "FROM public.vw_agenda_publica WHERE dentista_usuario_id IN (:ids)";
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("ids", dentistaIds);
        return namedParameterJdbcTemplate.queryForList(sql, parameters);
    }

    public List<Map<String, Object>> findAgendamentosByDentistasAndDataRange(List<UUID> dentistaIds, java.sql.Timestamp inicio, java.sql.Timestamp fim) {
        if (dentistaIds == null || dentistaIds.isEmpty()) return List.of();
        String sql = "SELECT id, dentista_id, data_hora, status " +
                     "FROM public.vw_agendamento_publico " +
                     "WHERE dentista_id IN (:ids) AND data_hora >= :inicio AND data_hora < :fim";
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("ids", dentistaIds);
        parameters.addValue("inicio", inicio);
        parameters.addValue("fim", fim);
        return namedParameterJdbcTemplate.queryForList(sql, parameters);
    }
}
