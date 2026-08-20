package projetosSpringcom.example.ClickSmile.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String tenantIdStr = jwt.getClaimAsString("tenantId");
            if (tenantIdStr != null && !tenantIdStr.isBlank()) {
                try {
                    TenantContext.setTenantId(UUID.fromString(tenantIdStr));
                } catch (IllegalArgumentException e) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Tenant ID inválido no token.");
                    return;
                }
            } else {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Tenant ID ausente no token.");
                return;
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}