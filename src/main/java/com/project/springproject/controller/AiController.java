package com.project.springproject.controller;

import com.project.springproject.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody(required = false) Map<String, Object> payload) {
        String userMessage = null;

        if (payload != null) {
            if (payload.containsKey("message") && payload.get("message") != null) {
                userMessage = String.valueOf(payload.get("message"));
            } else if (payload.containsKey("prompt") && payload.get("prompt") != null) {
                userMessage = String.valueOf(payload.get("prompt"));
            } else if (payload.containsKey("query") && payload.get("query") != null) {
                userMessage = String.valueOf(payload.get("query"));
            } else if (payload.containsKey("text") && payload.get("text") != null) {
                userMessage = String.valueOf(payload.get("text"));
            } else if (!payload.isEmpty()) {
                Object firstValue = payload.values().iterator().next();
                if (firstValue != null) {
                    userMessage = String.valueOf(firstValue);
                }
            }
        }

        if (userMessage == null || userMessage.isBlank()) {
            userMessage = "hello";
        }

        Map<String, Object> result = aiService.generateChatResponse(userMessage);
        return ResponseEntity.ok(result);
    }
}
