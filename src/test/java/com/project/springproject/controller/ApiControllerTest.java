package com.project.springproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.springproject.model.CommunityNeed;
import com.project.springproject.model.InventoryItem;
import com.project.springproject.model.PaperSurvey;
import com.project.springproject.model.Volunteer;
import com.project.springproject.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ApiControllerTest {

    private MockMvc mockMvc;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private CommunityNeedRepository needRepository;

    @Mock
    private VolunteerRepository volunteerRepository;

    @Mock
    private PaperSurveyRepository surveyRepository;

    @Mock
    private TaskAssignmentRepository taskRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private ApiController apiController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(apiController).build();
    }

    @Test
    void testGetAllInventory() throws Exception {
        InventoryItem item = new InventoryItem("First Aid Kit", "Medical", 50, "kits", 10, "Warehouse A");
        item.setId(1L);

        when(inventoryRepository.findAll()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("First Aid Kit"));
    }

    @Test
    void testCreateInventoryItem() throws Exception {
        InventoryItem item = new InventoryItem("Water Bottles", "Rations", 200, "bottles", 50, "Warehouse B");
        item.setId(2L);

        when(inventoryRepository.save(any(InventoryItem.class))).thenReturn(item);

        mockMvc.perform(post("/api/v1/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(item)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemName").value("Water Bottles"));
    }

    @Test
    void testGetCommunityNeeds() throws Exception {
        CommunityNeed need = new CommunityNeed("Emergency Medical Assistance", "Description", "Medical", "CRITICAL", 28.6300, 77.2170, "PENDING", "Connaught Place", 95);
        need.setId(1L);

        when(needRepository.findAll()).thenReturn(List.of(need));

        mockMvc.perform(get("/api/v1/needs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Emergency Medical Assistance"));
    }

    @Test
    void testAutoAssignTask() throws Exception {
        CommunityNeed need = new CommunityNeed("Food Distribution", "Description", "Food", "HIGH", 28.6140, 77.2095, "PENDING", "Central Park", 80);
        need.setId(10L);

        Volunteer vol1 = new Volunteer("Vol Near", "+91 90000 00001", "Food, Logistics", 28.6141, 77.2096, true, 0, 5.0);
        vol1.setId(100L);

        when(needRepository.findById(10L)).thenReturn(Optional.of(need));
        when(volunteerRepository.findAll()).thenReturn(List.of(vol1));

        Map<String, Object> payload = new HashMap<>();
        payload.put("needId", 10L);

        mockMvc.perform(post("/api/v1/tasks/auto-assign")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rankedVolunteers").isArray())
                .andExpect(jsonPath("$.rankedVolunteers[0].volunteer.name").value("Vol Near"));
    }

    @Test
    void testSearchCommunityNeeds() throws Exception {
        CommunityNeed need = new CommunityNeed("Medical Oxygen", "Emergency", "Medical", "CRITICAL", 28.0, 77.0, "PENDING", "Delhi", 90);
        when(needRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrAddressContainingIgnoreCase("medical", "medical", "medical"))
                .thenReturn(List.of(need));

        mockMvc.perform(get("/api/v1/needs").param("search", "medical"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Medical Oxygen"));
    }

    @Test
    void testSearchInventory() throws Exception {
        InventoryItem item = new InventoryItem("Oxygen Mask", "Medical", 100, "units", 20, "Store A");
        when(inventoryRepository.findByItemNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrLocationContainingIgnoreCase("oxygen", "oxygen", "oxygen"))
                .thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/inventory").param("search", "oxygen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("Oxygen Mask"));
    }
}
