package com.project.springproject.controller;

import com.project.springproject.model.Role;
import com.project.springproject.model.User;
import com.project.springproject.model.Volunteer;
import com.project.springproject.repository.UserRepository;
import com.project.springproject.repository.VolunteerRepository;
import com.project.springproject.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final VolunteerRepository volunteerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepository, VolunteerRepository volunteerRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.volunteerRepository = volunteerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String rawPassword = (String) payload.get("password");
        String roleStr = (String) payload.getOrDefault("role", "VOLUNTEER");
        String phone = (String) payload.getOrDefault("phone", "+91 98765 00000");
        String skills = (String) payload.getOrDefault("skills", "General Assistance, Dispatch");

        if (email == null || rawPassword == null || email.isBlank() || rawPassword.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        if (userRepository.existsByEmail(email)) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email is already registered! Please Sign In.");
            return ResponseEntity.badRequest().body(err);
        }

        Role role = Role.VOLUNTEER;
        try {
            role = Role.valueOf(roleStr.toUpperCase());
        } catch (Exception ignored) {}

        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        Double lat = payload.containsKey("latitude") ? Double.parseDouble(payload.get("latitude").toString()) : 28.6140;
        Double lng = payload.containsKey("longitude") ? Double.parseDouble(payload.get("longitude").toString()) : 77.2095;

        User user = new User(name, email, encodedPassword, role, phone, skills, lat, lng);
        User savedUser = userRepository.save(user);

        // If registered as a volunteer, automatically create a Volunteer profile in MySQL
        if (role == Role.VOLUNTEER || role == Role.DISPATCHER) {
            Volunteer volunteer = new Volunteer(name, phone, skills, lat, lng, true, 0, 4.9);
            volunteerRepository.save(volunteer);
        }

        String token = jwtUtils.generateJwtToken(savedUser.getEmail(), savedUser.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("token", token);
        
        Map<String, Object> userDto = new HashMap<>();
        userDto.put("id", savedUser.getId());
        userDto.put("name", savedUser.getName());
        userDto.put("email", savedUser.getEmail());
        userDto.put("role", savedUser.getRole().name());
        userDto.put("phone", savedUser.getPhone());
        userDto.put("skills", savedUser.getSkills());

        response.put("user", userDto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String rawPassword = payload.get("password");

        if (email == null || rawPassword == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid credentials. User not found.");
            return ResponseEntity.badRequest().body(err);
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid email or password.");
            return ResponseEntity.badRequest().body(err);
        }

        String token = jwtUtils.generateJwtToken(user.getEmail(), user.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Sign in successful");
        response.put("token", token);

        Map<String, Object> userDto = new HashMap<>();
        userDto.put("id", user.getId());
        userDto.put("name", user.getName());
        userDto.put("email", user.getEmail());
        userDto.put("role", user.getRole().name());
        userDto.put("phone", user.getPhone());
        userDto.put("skills", user.getSkills());

        response.put("user", userDto);

        return ResponseEntity.ok(response);
    }
}
