package lx.gestionale.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())                  // ← FIX 1: attiva CorsConfig
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // ← FIX 2: preflight libero

                        // Accesso pubblico
                        .requestMatchers("/api/v2/auth/**").permitAll()

                        // Solo il SUPER_ADMIN può creare nuovi Admin.
                        .requestMatchers("/api/v2/utenti/admin").hasRole("SUPER_ADMIN")

                        // Solo l'ADMIN (proprietario) crea la boutique.
                        .requestMatchers(HttpMethod.POST, "/api/v2/boutique").hasRole("ADMIN")
                        // Lista boutique dell'admin.
                        .requestMatchers(HttpMethod.GET, "/api/v2/boutique").hasRole("ADMIN")
                        // Endpoint per vedere tutte le boutique del sistema.
                        .requestMatchers(HttpMethod.GET, "/api/v2/boutique/tutte").hasRole("SUPER_ADMIN")
                        // Dettaglio boutique: il DIPENDENTE legge solo la propria, verificata nel service.
                        .requestMatchers(HttpMethod.GET, "/api/v2/boutique/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        // Altri accessi per entrambi.
                        .requestMatchers("/api/v2/boutique/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // Dati Aziendali e logo
                        .requestMatchers(HttpMethod.GET, "/api/v2/azienda/**").hasAnyRole("ADMIN", "DIPENDENTE")
                        .requestMatchers(HttpMethod.PUT, "/api/v2/azienda/**").hasRole("ADMIN")

                        // Tariffe
                        .requestMatchers(HttpMethod.GET, "/api/v2/tariffe/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/tariffe/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // Altre rotte esistenti
                        .requestMatchers("/api/v2/export/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/dashboard/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/ricariche/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/fatture/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")

                        // Chiusura
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
