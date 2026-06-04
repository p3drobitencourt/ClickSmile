    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/me")
    public Map<String, Object> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalStateException("Usuário não autenticado");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        java.util.UUID id = java.util.UUID.fromString(jwt.getSubject());

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        return Map.of(
            "id", usuario.getId(),
            "email", usuario.getEmail(),
            "perfil", usuario.getPerfil(),
            "tenantId", usuario.getTenantId()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> findById(@PathVariable UUID id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarCadastro(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null) return ResponseEntity.notFound().build();

        if (body.containsKey("nome")) usuario.setNome(body.get("nome"));
        if (body.containsKey("email")) usuario.setEmail(body.get("email"));

        usuarioRepository.save(usuario);
        return ResponseEntity.ok().build();
    }
}
