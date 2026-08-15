package com.project.springproject.service;

import com.project.springproject.model.CommunityNeed;
import com.project.springproject.model.InventoryItem;
import com.project.springproject.model.PaperSurvey;
import com.project.springproject.model.Volunteer;
import com.project.springproject.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    private final CommunityNeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;
    private final InventoryRepository inventoryRepository;
    private final PaperSurveyRepository surveyRepository;
    private final TaskAssignmentRepository taskRepository;

    @Value("${ai.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiService(CommunityNeedRepository needRepository,
                     VolunteerRepository volunteerRepository,
                     InventoryRepository inventoryRepository,
                     PaperSurveyRepository surveyRepository,
                     TaskAssignmentRepository taskRepository) {
        this.needRepository = needRepository;
        this.volunteerRepository = volunteerRepository;
        this.inventoryRepository = inventoryRepository;
        this.surveyRepository = surveyRepository;
        this.taskRepository = taskRepository;
    }

    public Map<String, Object> generateChatResponse(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Message cannot be empty.");
            return err;
        }

        // 1. Gather Live Real-Time Platform Context
        long needsCount = needRepository.count();
        long criticalNeedsCount = needRepository.findAll().stream()
                .filter(n -> "CRITICAL".equalsIgnoreCase(n.getUrgency()))
                .count();

        long volunteersCount = volunteerRepository.count();
        long availableVolunteers = volunteerRepository.findAll().stream()
                .filter(v -> v.getIsAvailable() == null || v.getIsAvailable())
                .count();

        List<InventoryItem> inventoryItems = inventoryRepository.findAll();
        long lowStockCount = inventoryItems.stream()
                .filter(i -> i.getQuantity() != null && i.getMinThreshold() != null && i.getQuantity() <= i.getMinThreshold())
                .count();

        long pendingSurveysCount = surveyRepository.findAll().stream()
                .filter(s -> "PENDING_REVIEW".equalsIgnoreCase(s.getVerificationStatus()))
                .count();

        long activeTasksCount = taskRepository.findAll().stream()
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()))
                .count();

        String systemContext = String.format(
            "UnityAlloc AI Context: Logged Needs=%d (%d Critical), Registered Volunteers=%d (%d Available), Inventory Stock Items=%d (%d Low Stock), Pending Surveys=%d, Active Tasks=%d.",
            needsCount, criticalNeedsCount, volunteersCount, availableVolunteers, inventoryItems.size(), lowStockCount, pendingSurveysCount, activeTasksCount
        );

        String replyText = null;

        // 2. Attempt External Gemini REST API Call if API key configured
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                replyText = callExternalGeminiApi(userMessage, systemContext);
            } catch (Exception e) {
                logger.warn("External Gemini API call failed or timed out. Falling back to local context engine: {}", e.getMessage());
            }
        }

        // 3. Fallback to Built-in Data-Aware Expert Intelligence Engine
        if (replyText == null || replyText.isBlank()) {
            replyText = generateLocalResponse(userMessage, userMessage.toLowerCase().trim(), needsCount, criticalNeedsCount, volunteersCount, availableVolunteers, inventoryItems, lowStockCount, pendingSurveysCount, activeTasksCount);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("reply", replyText);
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        
        Map<String, Object> contextMeta = new HashMap<>();
        contextMeta.put("needsCount", needsCount);
        contextMeta.put("volunteersCount", volunteersCount);
        contextMeta.put("inventoryCount", inventoryItems.size());
        contextMeta.put("pendingSurveys", pendingSurveysCount);
        response.put("context", contextMeta);

        return response;
    }

    private String callExternalGeminiApi(String userMessage, String systemContext) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", "System Context: " + systemContext + "\nUser Question: " + userMessage);

        Map<String, Object> contentObj = new HashMap<>();
        contentObj.put("parts", List.of(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentObj));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
        if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
            Map body = responseEntity.getBody();
            List candidates = (List) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map candidate = (Map) candidates.get(0);
                Map content = (Map) candidate.get("content");
                if (content != null) {
                    List parts = (List) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map part = (Map) parts.get(0);
                        return (String) part.get("text");
                    }
                }
            }
        }
        return null;
    }

    private String generateLocalResponse(String messageRaw, String messageLower, long needsCount, long criticalNeedsCount, long volunteersCount, long availableVolunteers, List<InventoryItem> inventoryItems, long lowStockCount, long pendingSurveysCount, long activeTasksCount) {
        StringBuilder reply = new StringBuilder();

        // Extract meaningful search terms (remove punctuation and common stop words)
        String cleanedMsg = messageLower.replaceAll("[^a-zA-Z0-9\\s]", " ");
        Set<String> stopWords = Set.of("how", "to", "the", "a", "an", "is", "are", "do", "does", "what", "where", "who", "which", "can", "i", "you", "we", "in", "on", "at", "for", "with", "about", "show", "check", "list", "get", "find", "me", "my", "any", "some", "all", "please");
        List<String> keywords = Arrays.stream(cleanedMsg.split("\\s+"))
                .filter(w -> w.length() > 2 && !stopWords.contains(w))
                .toList();

        // 1. Search Database Entities matching any extracted keyword
        List<CommunityNeed> matchedNeeds = keywords.isEmpty() ? List.of() : needRepository.findAll().stream()
                .filter(n -> keywords.stream().anyMatch(kw -> 
                    (n.getTitle() != null && n.getTitle().toLowerCase().contains(kw)) ||
                    (n.getCategory() != null && n.getCategory().toLowerCase().contains(kw)) ||
                    (n.getAddress() != null && n.getAddress().toLowerCase().contains(kw)) ||
                    (n.getDescription() != null && n.getDescription().toLowerCase().contains(kw))
                ))
                .limit(4)
                .toList();

        List<Volunteer> matchedVolunteers = keywords.isEmpty() ? List.of() : volunteerRepository.findAll().stream()
                .filter(v -> keywords.stream().anyMatch(kw -> 
                    (v.getName() != null && v.getName().toLowerCase().contains(kw)) ||
                    (v.getSkills() != null && v.getSkills().toLowerCase().contains(kw))
                ))
                .limit(4)
                .toList();

        List<InventoryItem> matchedInventory = keywords.isEmpty() ? List.of() : inventoryItems.stream()
                .filter(i -> keywords.stream().anyMatch(kw -> 
                    (i.getItemName() != null && i.getItemName().toLowerCase().contains(kw)) ||
                    (i.getCategory() != null && i.getCategory().toLowerCase().contains(kw)) ||
                    (i.getLocation() != null && i.getLocation().toLowerCase().contains(kw))
                ))
                .limit(4)
                .toList();

        // 2. Intent & Query Processing
        if (messageLower.contains("report") || messageLower.contains("log") || messageLower.contains("create need") || messageLower.contains("submit need") || messageLower.contains("add need") || messageLower.contains("request help")) {
            reply.append("🚑 **How to Report a Critical Emergency Need on UnityAlloc**:\n\n")
                 .append("1. **Navigate**: Go to the **Command Dashboard** or **Map Explorer** tab.\n")
                 .append("2. **Action**: Click **+ Report Need / Log Emergency**.\n")
                 .append("3. **Form Details**:\n")
                 .append("   • **Title & Description**: Describe emergency (e.g. Oxygen Cylinder Request, Food Ration, Medical Assistance).\n")
                 .append("   • **Category**: Select Medical, Food & Water, Shelter, or Logistics.\n")
                 .append("   • **Urgency Level**: Set to **CRITICAL** (Urgency Score 90+) for top dispatch priority.\n")
                 .append("   • **GPS Location**: Enter location address or select map coordinates.\n")
                 .append("4. **Submit**: Click **Submit Request**. The Smart Match Engine will instantly calculate nearby available volunteers!");
        } else if (messageLower.contains("match") || messageLower.contains("algorithm") || messageLower.contains("auto-assign") || messageLower.contains("score") || messageLower.contains("rank")) {
            reply.append("🎯 **UnityAlloc Smart Match Engine** operates using a weighted scoring algorithm:\n\n")
                 .append("• **Proximity / Distance (40%)**: Calculates Haversine distance between volunteer location and emergency site.\n")
                 .append("• **Skill Relevance (40%)**: Matches required relief category (e.g. Medical, Food) with volunteer skill tags.\n")
                 .append("• **Need Urgency (20%)**: Factors in urgency scores (CRITICAL = 90+, HIGH = 70+).\n\n")
                 .append("You can adjust weight sliders dynamically and assign volunteers in the **Match Engine** tab!");
        } else if (!matchedInventory.isEmpty()) {
            reply.append("📦 **Found Matching Inventory Items in Database**:\n\n");
            for (InventoryItem item : matchedInventory) {
                reply.append("• **").append(item.getItemName()).append("** (Category: ").append(item.getCategory()).append(")\n")
                     .append("  - Quantity: **").append(item.getQuantity()).append(" ").append(item.getUnit()).append("**\n")
                     .append("  - Warehouse Location: **").append(item.getLocation()).append("** (Alert Threshold: ").append(item.getMinThreshold()).append(")\n\n");
            }
            reply.append("View all stock levels in **NGO Portal -> Relief Stock**.");
        } else if (!matchedNeeds.isEmpty()) {
            reply.append("🚨 **Found Matching Community Needs in Database**:\n\n");
            for (CommunityNeed need : matchedNeeds) {
                reply.append("• **").append(need.getTitle()).append("** [Urgency: **").append(need.getUrgency()).append("** | Score: ").append(need.getUrgencyScore()).append("]\n")
                     .append("  - Category: ").append(need.getCategory()).append(" | Status: ").append(need.getStatus()).append("\n")
                     .append("  - Location: ").append(need.getAddress()).append("\n\n");
            }
            reply.append("Track active alerts on the **Command Dashboard** or **Map Explorer**.");
        } else if (!matchedVolunteers.isEmpty()) {
            reply.append("👥 **Found Matching Volunteers in Database**:\n\n");
            for (Volunteer vol : matchedVolunteers) {
                Boolean isAvail = vol.getIsAvailable();
                String statusStr = (isAvail != null && isAvail) ? "Available ✅" : "On Task ⏳";
                reply.append("• **").append(vol.getName()).append("** (").append(statusStr).append(")\n")
                     .append("  - Skills: ").append(vol.getSkills()).append("\n")
                     .append("  - Contact: ").append(vol.getPhone()).append(" | Rating: ⭐ ").append(vol.getRating()).append("\n\n");
            }
            reply.append("Manage volunteer pipelines under **Volunteer Hub**.");
        } else if (messageLower.contains("stock") || messageLower.contains("inventory") || messageLower.contains("suppl") || messageLower.contains("warehouse") || messageLower.contains("oxygen")) {
            reply.append("📦 **Live Relief Inventory Status**:\n\n")
                 .append("• Total Stock Items Tracked: **").append(inventoryItems.size()).append("**\n")
                 .append("• Low Stock Alert Items: **").append(lowStockCount).append("**\n\n");
            if (!inventoryItems.isEmpty()) {
                reply.append("Top stock items logged:\n");
                inventoryItems.stream().limit(5).forEach(item -> 
                    reply.append(" • ").append(item.getItemName()).append(": **").append(item.getQuantity()).append(" ").append(item.getUnit()).append("** (Location: ").append(item.getLocation()).append(")\n")
                );
            }
            reply.append("\nUpdate warehouse supplies under **NGO Portal -> Relief Stock**.");
        } else if (messageLower.contains("survey") || messageLower.contains("ocr") || messageLower.contains("paper") || messageLower.contains("form")) {
            reply.append("📋 **Paper Survey OCR Pipeline**:\n\n")
                 .append("• Pending Review Queue: **").append(pendingSurveysCount).append(" forms**\n\n")
                 .append("Field volunteers upload photo scans of handwritten paper surveys in **Volunteer Hub -> Paper Survey OCR**. The built-in OCR engine automatically parses form fields into JSON for instant dispatcher review.");
        } else if (messageLower.contains("volunteer") || messageLower.contains("pipeline") || messageLower.contains("staff") || messageLower.contains("people")) {
            reply.append("👥 **Volunteer Operations Summary**:\n\n")
                 .append("• Total Registered Volunteers: **").append(volunteersCount).append("**\n")
                 .append("• Currently Available: **").append(availableVolunteers).append("**\n")
                 .append("• Active Dispatch Tasks: **").append(activeTasksCount).append("**\n\n")
                 .append("Dispatch available volunteers to urgent needs in **Volunteer Hub** or **Match Engine**.");
        } else if (messageLower.contains("food") || messageLower.contains("blood") || messageLower.contains("donor") || messageLower.contains("socionet") || messageLower.contains("ration")) {
            reply.append("🍲 **Food & Blood Rescue Portal (SocioNet)**:\n\n")
                 .append("• **Food Ration Rescue**: Coordinates bulk meal distribution to disaster shelters.\n")
                 .append("• **Blood Bank Network**: Real-time donor matching for rare blood types (O-Neg, A-Pos, B-Pos).\n\n")
                 .append("Access donor matching under the **Food & Blood** tab!");
        } else if (messageLower.contains("login") || messageLower.contains("log in") || messageLower.contains("signin") || messageLower.contains("sign in") || messageLower.contains("signup") || messageLower.contains("sign up") || messageLower.contains("auth") || messageLower.contains("account") || messageLower.contains("password") || messageLower.contains("role")) {
            reply.append("🔐 **Authentication & User Roles**:\n\n")
                 .append("• **Sign In / Registration**: Access system via top navigation login menu.\n")
                 .append("• **Roles**: Field Volunteer, Dispatcher, NGO Partner.\n")
                 .append("• **Security**: BCrypt password hashing + JWT token authorization.");
        } else if (messageLower.contains("ngo") || messageLower.contains("dispatch") || messageLower.contains("command")) {
            reply.append("🏢 **NGO Partner & Command Center**:\n\n")
                 .append("• **Relief Stock**: Update warehouse inventory & low stock alerts.\n")
                 .append("• **Task Dispatching**: Rank and assign field volunteers to critical community needs.\n\n")
                 .append("Access tools in the **NGO Portal**.");
        } else if (messageLower.contains("map") || messageLower.contains("gis") || messageLower.contains("heatmap") || messageLower.contains("location") || messageLower.contains("where")) {
            reply.append("🗺️ **Interactive GIS Map Explorer**:\n\n")
                 .append("• Pinpoints GPS locations for emergency needs (Red pins) and active volunteers (Green pins).\n")
                 .append("• Toggle Urgency Heatmaps to identify high-risk disaster clusters.\n\n")
                 .append("Explore the **Map Explorer** tab!");
        } else if (messageLower.contains("help") || messageLower.contains("guide") || messageLower.contains("about") || messageLower.contains("feature")) {
            reply.append("💡 **UnityAlloc Command System Guide**:\n\n")
                 .append("1. **Dashboard**: Real-time stats on community needs, volunteers, inventory, and risk levels.\n")
                 .append("2. **Match Engine**: Smart automated volunteer ranking and auto-dispatch.\n")
                 .append("3. **Food & Blood Rescue**: Rapid response portal for food box distribution and blood donor matching.\n")
                 .append("4. **Volunteer Hub**: Skill profile registration and paper survey OCR.\n")
                 .append("5. **NGO Portal**: Warehouse stock management and organizational dispatching.");
        } else if (messageLower.matches(".*\\b(hello|hi|hey|greetings|welcome)\\b.*")) {
            reply.append("Hello! I am **UnityAlloc AI Copilot**, your real-time command assistant. ")
                 .append("I am actively monitoring platform data. Ask me any question about needs, volunteers, inventory, or disaster relief!");
        } else {
            // Intelligent clean response for generic questions
            reply.append("Hello! I am **UnityAlloc AI Copilot**. Here is the current live platform status:\n\n")
                 .append("• **Active Emergency Needs**: **").append(needsCount).append("** logged (").append(criticalNeedsCount).append(" Critical priority)\n")
                 .append("• **Field Volunteers**: **").append(availableVolunteers).append("** available out of ").append(volunteersCount).append(" total\n")
                 .append("• **Relief Inventory**: **").append(inventoryItems.size()).append("** tracked stock items (").append(lowStockCount).append(" low stock alerts)\n")
                 .append("• **Tasks & Surveys**: **").append(pendingSurveysCount).append("** pending paper OCR forms, **").append(activeTasksCount).append("** active tasks\n\n")
                 .append("Feel free to ask about specific **emergency needs**, **volunteer skills**, **inventory stock**, or **disaster relief workflows**!");
        }

        return reply.toString();
    }
}
