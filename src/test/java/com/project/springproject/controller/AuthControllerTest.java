package com.project.springproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.springproject.model.Role;
import com.project.springproject.model.User;
import com.project.springproject.repository.UserRepository;
import com.project.springproject.repository.VolunteerRepository;
import com.project.springproject.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VolunteerRepository volunteerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    void testRegisterUserSuccess() throws Exception {
        User user = new User("Test Volunteer", "testvol@example.com", "encodedPass", Role.VOLUNTEER, "+91 99999 88888", "Medical", 28.0, 77.0);
        user.setId(1L);

        when(userRepository.existsByEmail("testvol@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtils.generateJwtToken("testvol@example.com", "VOLUNTEER")).thenReturn("mock-jwt-token");

        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Test Volunteer");
        payload.put("email", "testvol@example.com");
        payload.put("password", "password123");
        payload.put("role", "VOLUNTEER");

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("testvol@example.com"));
    }

    @Test
    void testRegisterUserMissingFields() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Incomplete User");

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email and password are required"));
    }

    @Test
    void testRegisterDuplicateEmail() throws Exception {
        when(userRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Duplicate User");
        payload.put("email", "duplicate@example.com");
        payload.put("password", "password123");

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email is already registered! Please Sign In."));
    }

    @Test
    void testSignInSuccess() throws Exception {
        User user = new User("John Doe", "john@example.com", "encodedPass", Role.VOLUNTEER, "123", "Skills", 28.0, 77.0);
        user.setId(2L);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPass")).thenReturn(true);
        when(jwtUtils.generateJwtToken("john@example.com", "VOLUNTEER")).thenReturn("mock-jwt-token");

        Map<String, String> payload = new HashMap<>();
        payload.put("email", "john@example.com");
        payload.put("password", "password123");

        mockMvc.perform(post("/api/v1/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"));
    }

    @Test
    void testSignInInvalidPassword() throws Exception {
        User user = new User("John Doe", "john@example.com", "encodedPass", Role.VOLUNTEER, "123", "Skills", 28.0, 77.0);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encodedPass")).thenReturn(false);

        Map<String, String> payload = new HashMap<>();
        payload.put("email", "john@example.com");
        payload.put("password", "wrongpass");

        mockMvc.perform(post("/api/v1/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid email or password."));
    }
}
