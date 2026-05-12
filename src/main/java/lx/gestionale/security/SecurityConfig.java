package lx.gestionale.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Accesso pubblico
                        .requestMatchers("/api/v2/auth/**").permitAll()

                        // Solo il SUPER_ADMIN può creare nuovi Admin.
                        .requestMatchers("/api/v2/utenti/admin").hasRole("SUPER_ADMIN")

                        // Solo l'ADMIN (proprietario) crea la boutique.
                        .requestMatchers(HttpMethod.POST, "/api/v2/boutique").hasRole("ADMIN")
                        // Endpoint per vedere tutte le boutique del sistema.
                        .requestMatchers(HttpMethod.GET, "/api/v2/boutique/tutte").hasRole("SUPER_ADMIN")
                        // Altri accessi per entrambi.
                        .requestMatchers("/api/v2/boutique/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // Altre rotte esistenti
                        .requestMatchers("/api/v2/export/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/dashboard/admin").hasRole("ADMIN")
                        .requestMatchers("/api/v2/dashboard/riepilogo").hasRole("DIPENDENTE")
                        .requestMatchers("/api/v2/tariffe/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/v2/ricariche/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers(HttpMethod.GET, "/api/v2/fatture/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/fatture/**").hasAnyRole("ADMIN", "DIPENDENTE")
                        .requestMatchers("/api/v2/azienda/**").hasRole("ADMIN")

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