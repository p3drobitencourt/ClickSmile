package projetosSpringcom.example.ClickSmile.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;
import projetosSpringcom.example.ClickSmile.repository.DentistaRepository;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TenantClinicaRepository tenantRepository;
    @Mock
    private PacienteRepository pacienteRepository;
    @Mock
    private DentistaRepository dentistaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegistrationService registrationService;

    private RegisterRequest dentistaRequest;

    @BeforeEach
    void setUp() {
        dentistaRequest = new RegisterRequest(
            "Dr. Teste",
            "dr@teste.com",
            "123456",
            null,
            "CRO-123",
            "Ortodontia",
            "Clinica Teste",
            "11.111.111/1111-11",
            null,
            Perfil.DENTISTA
        );
    }

    @Test
    void testDentistaWithExistingCro_failsBeforeTenantCreation() {
        // Arrange
        when(usuarioRepository.findAuthUserByEmailBypassingRls(anyString())).thenReturn(Collections.emptyList());
        when(tenantRepository.findByCnpj(anyString())).thenReturn(Optional.empty());
        when(dentistaRepository.existsByCro("CRO-123")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            registrationService.register(dentistaRequest);
        });

        assertEquals("Já existe um dentista com este CRO.", exception.getMessage());
        // Verify tenant is never saved
        verify(tenantRepository, never()).save(any(TenantClinica.class));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void testDentistaWithExistingCnpj_failsBeforeTenantCreation() {
        // Arrange
        when(usuarioRepository.findAuthUserByEmailBypassingRls(anyString())).thenReturn(Collections.emptyList());
        when(tenantRepository.findByCnpj(anyString())).thenReturn(Optional.of(new TenantClinica()));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            registrationService.register(dentistaRequest);
        });

        assertEquals("Já existe uma clínica com este CNPJ.", exception.getMessage());
        // Verify tenant is never saved
        verify(tenantRepository, never()).save(any(TenantClinica.class));
        verify(dentistaRepository, never()).existsByCro(anyString());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void testDentistaWithExistingEmail_failsBeforeTenantCreation() {
        // Arrange
        when(usuarioRepository.findAuthUserByEmailBypassingRls(anyString())).thenReturn(Collections.singletonList(new Object[]{}));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            registrationService.register(dentistaRequest);
        });

        assertEquals("Já existe um usuário com este e-mail.", exception.getMessage());
        // Verify tenant is never saved
        verify(tenantRepository, never()).save(any(TenantClinica.class));
        verify(tenantRepository, never()).findByCnpj(anyString());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void testDentistaWithValidData_succeeds() {
        // Arrange
        when(usuarioRepository.findAuthUserByEmailBypassingRls(anyString())).thenReturn(Collections.emptyList());
        when(tenantRepository.findByCnpj(anyString())).thenReturn(Optional.empty());
        when(dentistaRepository.existsByCro(anyString())).thenReturn(false);
        when(tenantRepository.save(any(TenantClinica.class))).thenAnswer(i -> {
            TenantClinica t = i.getArgument(0);
            t.setId(java.util.UUID.randomUUID());
            return t;
        });
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        // Act
        registrationService.register(dentistaRequest);

        // Assert
        verify(tenantRepository).save(any(TenantClinica.class));
        verify(usuarioRepository).save(any());
    }
}
