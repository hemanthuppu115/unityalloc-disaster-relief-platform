package com.project.springproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.springproject.service.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AiControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AiService aiService;

    @InjectMocks
    private AiController aiController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(aiController).build();
    }

    @Test
    void testChatSuccess() throws Exception {
        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("reply", "UnityAlloc AI Copilot is operational.");
        mockResult.put("timestamp", "14:30");

        when(aiService.generateChatResponse("How does matching work?")).thenReturn(mockResult);

        Map<String, String> payload = new HashMap<>();
        payload.put("message", "How does matching work?");

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("UnityAlloc AI Copilot is operational."))
                .andExpect(jsonPath("$.timestamp").value("14:30"));
    }

    @Test
    void testChatMissingMessage() throws Exception {
        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("reply", "Hello! I am UnityAlloc AI Copilot");
        when(aiService.generateChatResponse("hello")).thenReturn(mockResult);

        Map<String, String> payload = new HashMap<>();

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Hello! I am UnityAlloc AI Copilot"));
    }

    @Test
    void testChatArbitraryQuestion() throws Exception {
        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("reply", "🤖 UnityAlloc AI Assistant Response for custom query.");
        mockResult.put("timestamp", "14:35");

        when(aiService.generateChatResponse("Can you list emergency needs in Delhi?")).thenReturn(mockResult);

        Map<String, String> payload = new HashMap<>();
        payload.put("message", "Can you list emergency needs in Delhi?");

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("🤖 UnityAlloc AI Assistant Response for custom query."))
                .andExpect(jsonPath("$.timestamp").value("14:35"));
    }
}
