package projetosSpringcom.example.ClickSmile.service;

public class AgendamentoConflictException extends RuntimeException {
    public AgendamentoConflictException(String message) {
        super(message);
    }
    public AgendamentoConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
