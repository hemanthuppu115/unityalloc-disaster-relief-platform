package com.project.springproject.controller;

import com.project.springproject.model.ActivityLog;
import com.project.springproject.model.CommunityNeed;
import com.project.springproject.model.InventoryItem;
import com.project.springproject.model.PaperSurvey;
import com.project.springproject.model.TaskAssignment;
import com.project.springproject.model.Volunteer;
import com.project.springproject.repository.ActivityLogRepository;
import com.project.springproject.repository.CommunityNeedRepository;
import com.project.springproject.repository.InventoryRepository;
import com.project.springproject.repository.PaperSurveyRepository;
import com.project.springproject.repository.TaskAssignmentRepository;
import com.project.springproject.repository.VolunteerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    private final CommunityNeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;
    private final TaskAssignmentRepository taskRepository;
    private final PaperSurveyRepository surveyRepository;
    private final InventoryRepository inventoryRepository;
    private final ActivityLogRepository activityLogRepository;

    public ApiController(CommunityNeedRepository needRepository,
                         VolunteerRepository volunteerRepository,
                         TaskAssignmentRepository taskRepository,
                         PaperSurveyRepository surveyRepository,
                         InventoryRepository inventoryRepository,
                         ActivityLogRepository activityLogRepository) {
        this.needRepository = needRepository;
        this.volunteerRepository = volunteerRepository;
        this.taskRepository = taskRepository;
        this.surveyRepository = surveyRepository;
        this.inventoryRepository = inventoryRepository;
        this.activityLogRepository = activityLogRepository;
    }

    // --- DYNAMIC REACTIVE STATS ENDPOINT ---
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        List<CommunityNeed> needs = needRepository.findAll();
        List<Volunteer> volunteers = volunteerRepository.findAll();
        List<TaskAssignment> tasks = taskRepository.findAll();
        List<InventoryItem> inventory = inventoryRepository.findAll();
        List<PaperSurvey> surveys = surveyRepository.findAll();

        long totalNeeds = needs.size();
        long criticalNeeds = needs.stream()
                .filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()))
                .filter(n -> "CRITICAL".equalsIgnoreCase(n.getUrgency()))
                .count();
        long highNeeds = needs.stream().filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()) && "HIGH".equalsIgnoreCase(n.getUrgency())).count();
        long mediumNeeds = needs.stream().filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()) && "MEDIUM".equalsIgnoreCase(n.getUrgency())).count();
        long lowNeeds = needs.stream().filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()) && "LOW".equalsIgnoreCase(n.getUrgency())).count();

        long resolvedNeeds = needs.stream().filter(n -> "RESOLVED".equalsIgnoreCase(n.getStatus())).count();
        long assignedNeeds = needs.stream().filter(n -> "IN_PROGRESS".equalsIgnoreCase(n.getStatus())).count();
        long unassignedNeeds = needs.stream().filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()) && !"IN_PROGRESS".equalsIgnoreCase(n.getStatus())).count();

        long totalVolunteers = volunteers.size();
        long availableVolunteers = volunteers.stream().filter(v -> v.getIsAvailable() == null || v.getIsAvailable()).count();
        long dispatchedVolunteers = volunteers.stream().filter(v -> v.getIsAvailable() != null && !v.getIsAvailable()).count();

        long activeDispatches = tasks.stream().filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        long completedDispatches = tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();

        long totalInventoryItems = inventory.size();
        long totalInventoryQuantity = inventory.stream().mapToLong(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
        long lowStockItems = inventory.stream().filter(i -> i.getQuantity() != null && i.getMinThreshold() != null && i.getQuantity() <= i.getMinThreshold()).count();

        long pendingSurveys = surveys.stream().filter(s -> "PENDING_REVIEW".equalsIgnoreCase(s.getVerificationStatus())).count();
        long verifiedSurveys = surveys.stream().filter(s -> "VERIFIED".equalsIgnoreCase(s.getVerificationStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalNeeds", totalNeeds);
        stats.put("criticalNeeds", criticalNeeds);
        stats.put("highNeeds", highNeeds);
        stats.put("mediumNeeds", mediumNeeds);
        stats.put("lowNeeds", lowNeeds);
        stats.put("resolvedNeeds", resolvedNeeds);
        stats.put("assignedNeeds", assignedNeeds);
        stats.put("unassignedNeeds", unassignedNeeds);

        stats.put("totalVolunteers", totalVolunteers);
        stats.put("availableVolunteers", availableVolunteers);
        stats.put("dispatchedVolunteers", dispatchedVolunteers);

        stats.put("activeDispatches", activeDispatches);
        stats.put("completedDispatches", completedDispatches);

        stats.put("totalInventoryItems", totalInventoryItems);
        stats.put("lowStockItems", lowStockItems);

        stats.put("pendingSurveys", pendingSurveys);
        stats.put("verifiedSurveys", verifiedSurveys);

        return ResponseEntity.ok(stats);
    }

    // --- ACTIVITY FEED ENDPOINT ---
    @GetMapping("/activity")
    public List<ActivityLog> getActivityLogs() {
        return activityLogRepository.findTop20ByOrderByTimestampDesc();
    }

    // --- DUPLICATE DETECTION CHECK ---
    @PostMapping("/needs/check-duplicate")
    public ResponseEntity<Map<String, Object>> checkDuplicateNeed(@RequestBody Map<String, String> payload) {
        String title = payload.getOrDefault("title", "").toLowerCase().trim();
        String address = payload.getOrDefault("address", "").toLowerCase().trim();

        Optional<CommunityNeed> duplicateOpt = needRepository.findAll().stream()
                .filter(n -> !"RESOLVED".equalsIgnoreCase(n.getStatus()))
                .filter(n -> (n.getTitle() != null && n.getTitle().toLowerCase().contains(title)) ||
                             (n.getAddress() != null && n.getAddress().toLowerCase().contains(address)))
                .findFirst();

        Map<String, Object> response = new HashMap<>();
        if (duplicateOpt.isPresent()) {
            response.put("duplicateFound", true);
            response.put("existingNeed", duplicateOpt.get());
            response.put("message", "A similar active emergency report was found: \"" + duplicateOpt.get().getTitle() + "\".");
        } else {
            response.put("duplicateFound", false);
        }
        return ResponseEntity.ok(response);
    }

    // --- INVENTORY ENDPOINTS ---
    @GetMapping("/inventory")
    public List<InventoryItem> getAllInventory(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return inventoryRepository.findByItemNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrLocationContainingIgnoreCase(search, search, search);
        }
        return inventoryRepository.findAll();
    }

    @PostMapping("/inventory")
    public InventoryItem createInventoryItem(@RequestBody InventoryItem item) {
        InventoryItem saved = inventoryRepository.save(item);
        activityLogRepository.save(new ActivityLog("STOCK_UPDATED", "New relief stock added: " + item.getItemName() + " (" + item.getQuantity() + " " + item.getUnit() + ")", "INVENTORY", saved.getId()));
        return saved;
    }

    @PutMapping("/inventory/{id}")
    public ResponseEntity<InventoryItem> updateInventoryItem(@PathVariable Long id, @RequestBody InventoryItem updated) {
        return inventoryRepository.findById(id).map(existing -> {
            existing.setItemName(updated.getItemName());
            existing.setCategory(updated.getCategory());
            existing.setQuantity(updated.getQuantity());
            existing.setUnit(updated.getUnit());
            existing.setMinThreshold(updated.getMinThreshold());
            existing.setLocation(updated.getLocation());
            InventoryItem saved = inventoryRepository.save(existing);
            activityLogRepository.save(new ActivityLog("STOCK_UPDATED", "Relief stock updated: " + saved.getItemName() + " (Qty: " + saved.getQuantity() + ")", "INVENTORY", saved.getId()));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        if (inventoryRepository.existsById(id)) {
            inventoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // --- TASK ASSIGNMENT ENDPOINTS ---
    @GetMapping("/tasks")
    public List<TaskAssignment> getAllTasks() {
        return taskRepository.findAll();
    }

    // --- COMMUNITY NEEDS ENDPOINTS ---
    @GetMapping("/needs")
    public List<CommunityNeed> getAllNeeds(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return needRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrAddressContainingIgnoreCase(search, search, search);
        }
        return needRepository.findAll();
    }

    @PostMapping("/needs")
    public CommunityNeed createNeed(@RequestBody CommunityNeed need) {
        if (need.getStatus() == null || need.getStatus().isBlank()) need.setStatus("PENDING");
        if (need.getUrgencyScore() == null) need.setUrgencyScore(85);
        if (need.getUrgency() == null || need.getUrgency().isBlank()) need.setUrgency("HIGH");
        CommunityNeed saved = needRepository.save(need);
        activityLogRepository.save(new ActivityLog("NEED_CREATED", "Emergency need reported: " + saved.getTitle() + " [" + saved.getUrgency() + "]", "NEED", saved.getId()));
        return saved;
    }

    @PutMapping("/needs/{id}")
    public ResponseEntity<CommunityNeed> updateNeed(@PathVariable Long id, @RequestBody CommunityNeed updated) {
        return needRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setCategory(updated.getCategory());
            existing.setUrgency(updated.getUrgency());
            existing.setAddress(updated.getAddress());
            existing.setDescription(updated.getDescription());
            if (updated.getUrgencyScore() != null) existing.setUrgencyScore(updated.getUrgencyScore());
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            CommunityNeed saved = needRepository.save(existing);
            activityLogRepository.save(new ActivityLog("NEED_UPDATED", "Community need details updated: " + saved.getTitle(), "NEED", saved.getId()));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/needs/{id}")
    public ResponseEntity<CommunityNeed> getNeedById(@PathVariable Long id) {
        return needRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- VOLUNTEERS ENDPOINTS ---
    @GetMapping("/volunteers")
    public List<Volunteer> getAllVolunteers(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return volunteerRepository.findByNameContainingIgnoreCaseOrSkillsContainingIgnoreCase(search, search);
        }
        return volunteerRepository.findAll();
    }

    @PostMapping("/volunteers")
    public Volunteer createVolunteer(@RequestBody Volunteer volunteer) {
        if (volunteer.getIsAvailable() == null) volunteer.setIsAvailable(true);
        if (volunteer.getActiveTasksCount() == null) volunteer.setActiveTasksCount(0);
        if (volunteer.getRating() == null) volunteer.setRating(4.8);
        Volunteer saved = volunteerRepository.save(volunteer);
        activityLogRepository.save(new ActivityLog("VOLUNTEER_REGISTERED", "New responder registered: " + saved.getName(), "VOLUNTEER", saved.getId()));
        return saved;
    }

    @PutMapping("/volunteers/{id}")
    public ResponseEntity<Volunteer> updateVolunteer(@PathVariable Long id, @RequestBody Volunteer updated) {
        return volunteerRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setPhone(updated.getPhone());
            existing.setSkills(updated.getSkills());
            if (updated.getIsAvailable() != null) existing.setIsAvailable(updated.getIsAvailable());
            if (updated.getRating() != null) existing.setRating(updated.getRating());
            if (updated.getActiveTasksCount() != null) existing.setActiveTasksCount(updated.getActiveTasksCount());
            Volunteer saved = volunteerRepository.save(existing);
            activityLogRepository.save(new ActivityLog("VOLUNTEER_UPDATED", "Volunteer profile updated: " + saved.getName(), "VOLUNTEER", saved.getId()));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- PAPER SURVEYS ENDPOINTS ---
    @GetMapping("/surveys")
    public List<PaperSurvey> getAllSurveys(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return surveyRepository.findBySurveyNumberContainingIgnoreCaseOrExtractedJsonContainingIgnoreCase(search, search);
        }
        return surveyRepository.findAll();
    }

    @PostMapping("/surveys")
    public PaperSurvey createSurvey(@RequestBody PaperSurvey survey) {
        if (survey.getVerificationStatus() == null) {
            survey.setVerificationStatus("PENDING_REVIEW");
        }
        if (survey.getSurveyNumber() == null) {
            survey.setSurveyNumber("SRV-MOB-" + (1000 + new Random().nextInt(9000)));
        }
        PaperSurvey saved = surveyRepository.save(survey);
        activityLogRepository.save(new ActivityLog("SURVEY_INGESTED", "Paper survey scan ingested: " + saved.getSurveyNumber(), "SURVEY", saved.getId()));
        return saved;
    }

    @PutMapping("/surveys/{id}")
    public ResponseEntity<PaperSurvey> updateSurvey(@PathVariable Long id, @RequestBody PaperSurvey updated) {
        return surveyRepository.findById(id).map(existing -> {
            if (updated.getSurveyNumber() != null) existing.setSurveyNumber(updated.getSurveyNumber());
            if (updated.getImageUrl() != null) existing.setImageUrl(updated.getImageUrl());
            if (updated.getExtractedJson() != null) existing.setExtractedJson(updated.getExtractedJson());
            if (updated.getVerificationStatus() != null) existing.setVerificationStatus(updated.getVerificationStatus());
            if (updated.getReviewerNotes() != null) existing.setReviewerNotes(updated.getReviewerNotes());
            return ResponseEntity.ok(surveyRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/surveys/verify/{id}")
    public ResponseEntity<PaperSurvey> verifySurvey(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return surveyRepository.findById(id).map(survey -> {
            survey.setVerificationStatus(body.getOrDefault("status", "VERIFIED"));
            survey.setReviewerNotes(body.get("notes"));
            PaperSurvey saved = surveyRepository.save(survey);
            activityLogRepository.save(new ActivityLog("SURVEY_CONVERTED", "Paper survey " + saved.getSurveyNumber() + " verified & converted into active need", "SURVEY", saved.getId()));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- SMART AUTO-ASSIGN ENDPOINT ---
    @PostMapping("/tasks/auto-assign")
    public ResponseEntity<Map<String, Object>> autoAssignTask(@RequestBody Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("needId") || payload.get("needId") == null) {
            return ResponseEntity.badRequest().build();
        }
        Long needId;
        try {
            needId = Long.valueOf(payload.get("needId").toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        double tempDistanceWeight = 0.4;
        double tempSkillWeight = 0.4;
        double tempUrgencyWeight = 0.2;
        try {
            if (payload.containsKey("distanceWeight")) tempDistanceWeight = Double.parseDouble(payload.get("distanceWeight").toString());
            if (payload.containsKey("skillWeight")) tempSkillWeight = Double.parseDouble(payload.get("skillWeight").toString());
            if (payload.containsKey("urgencyWeight")) tempUrgencyWeight = Double.parseDouble(payload.get("urgencyWeight").toString());
        } catch (Exception ignored) {}

        final double distanceWeight = tempDistanceWeight;
        final double skillWeight = tempSkillWeight;
        final double urgencyWeight = tempUrgencyWeight;

        Optional<CommunityNeed> needOpt = needRepository.findById(needId);
        if (needOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CommunityNeed need = needOpt.get();
        List<Volunteer> availableVolunteers = volunteerRepository.findAll();

        List<Map<String, Object>> rankedMatches = availableVolunteers.stream()
            .filter(v -> v.getIsAvailable() == null || v.getIsAvailable())
            .map(vol -> {
            double vLat = vol.getLatitude() != null ? vol.getLatitude() : 28.6139;
            double vLng = vol.getLongitude() != null ? vol.getLongitude() : 77.2090;
            double nLat = need.getLatitude() != null ? need.getLatitude() : 28.6139;
            double nLng = need.getLongitude() != null ? need.getLongitude() : 77.2090;

            double distKm = Math.sqrt(Math.pow((vLat - nLat) * 111, 2) + Math.pow((vLng - nLng) * 111, 2));
            double proxScore = Math.max(0, 100 - (distKm * 10)); // 100 max score
            
            boolean skillMatch = vol.getSkills() != null && need.getCategory() != null && 
                    vol.getSkills().toLowerCase().contains(need.getCategory().toLowerCase());
            double skillScore = skillMatch ? 100.0 : 60.0;

            double urgencyScoreVal = need.getUrgencyScore() != null ? need.getUrgencyScore() : 70.0;

            double matchScore = (proxScore * distanceWeight) + (skillScore * skillWeight) + (urgencyScoreVal * urgencyWeight);

            Map<String, Object> item = new HashMap<>();
            item.put("volunteer", vol);
            item.put("distanceKm", Math.round(distKm * 10.0) / 10.0);
            item.put("matchScore", (double) Math.round(matchScore));
            item.put("proximityScore", (double) Math.round(proxScore));
            item.put("skillScore", (double) Math.round(skillScore));
            return item;
        }).sorted((a, b) -> Double.compare(((Number) b.get("matchScore")).doubleValue(), ((Number) a.get("matchScore")).doubleValue()))
          .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("need", need);
        response.put("rankedVolunteers", rankedMatches);
        return ResponseEntity.ok(response);
    }

    // --- TASK DISPATCH ENDPOINT WITH VALIDATION & LIFECYCLE ---
    @PostMapping("/tasks/dispatch")
    public ResponseEntity<?> dispatchTask(@RequestBody TaskAssignment assignment) {
        if (assignment.getNeedId() == null || assignment.getVolunteerId() == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Need ID and Volunteer ID are required for task dispatch.");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<Volunteer> volOpt = volunteerRepository.findById(assignment.getVolunteerId());
        if (volOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Volunteer profile not found.");
            return ResponseEntity.badRequest().body(err);
        }

        Volunteer volunteer = volOpt.get();
        if (volunteer.getIsAvailable() != null && !volunteer.getIsAvailable()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Volunteer " + volunteer.getName() + " is already handling an active dispatch.");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<CommunityNeed> needOpt = needRepository.findById(assignment.getNeedId());
        if (needOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Community need not found.");
            return ResponseEntity.badRequest().body(err);
        }

        CommunityNeed need = needOpt.get();
        if ("RESOLVED".equalsIgnoreCase(need.getStatus())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "This emergency need has already been resolved.");
            return ResponseEntity.badRequest().body(err);
        }

        assignment.setStatus("ACCEPTED");
        assignment.setAcceptedAt(LocalDateTime.now());
        TaskAssignment saved = taskRepository.save(assignment);

        // Update community need status to IN_PROGRESS
        need.setStatus("IN_PROGRESS");
        needRepository.save(need);

        // Update volunteer availability status
        volunteer.setIsAvailable(false);
        volunteer.setActiveTasksCount((volunteer.getActiveTasksCount() != null ? volunteer.getActiveTasksCount() : 0) + 1);
        volunteerRepository.save(volunteer);

        activityLogRepository.save(new ActivityLog("VOLUNTEER_DISPATCHED", "Volunteer " + volunteer.getName() + " dispatched to " + need.getTitle(), "TASK", saved.getId()));

        return ResponseEntity.ok(saved);
    }

    // --- DISPATCH STATUS TRANSITION & TIMELINE ENDPOINT ---
    @PutMapping("/tasks/{id}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "ACCEPTED").toUpperCase();
        Optional<TaskAssignment> taskOpt = taskRepository.findById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TaskAssignment task = taskOpt.get();
        task.setStatus(newStatus);
        LocalDateTime now = LocalDateTime.now();

        if ("EN_ROUTE".equalsIgnoreCase(newStatus)) {
            task.setEnRouteAt(now);
            activityLogRepository.save(new ActivityLog("DISPATCH_STATUS", "Task #" + id + " updated to EN_ROUTE", "TASK", id));
        } else if ("ON_SITE".equalsIgnoreCase(newStatus)) {
            task.setOnSiteAt(now);
            activityLogRepository.save(new ActivityLog("DISPATCH_STATUS", "Volunteer arrived ON_SITE for Task #" + id, "TASK", id));
        } else if ("IN_PROGRESS".equalsIgnoreCase(newStatus)) {
            task.setInProgressAt(now);
            activityLogRepository.save(new ActivityLog("DISPATCH_STATUS", "Relief task #" + id + " IN_PROGRESS", "TASK", id));
        } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            task.setCompletedAt(now);
            
            needRepository.findById(task.getNeedId()).ifPresent(need -> {
                need.setStatus("RESOLVED");
                need.setUrgency("LOW");
                needRepository.save(need);
                activityLogRepository.save(new ActivityLog("NEED_RESOLVED", "Emergency need resolved: " + need.getTitle(), "NEED", need.getId()));
            });

            volunteerRepository.findById(task.getVolunteerId()).ifPresent(vol -> {
                int currentTasks = vol.getActiveTasksCount() != null ? vol.getActiveTasksCount() : 1;
                vol.setActiveTasksCount(Math.max(0, currentTasks - 1));
                vol.setIsAvailable(true);
                volunteerRepository.save(vol);
            });

            activityLogRepository.save(new ActivityLog("TASK_COMPLETED", "Task #" + id + " successfully COMPLETED!", "TASK", id));
        }

        TaskAssignment saved = taskRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    // --- DELETE ENDPOINTS ---
    @Transactional
    @DeleteMapping("/needs/{id}")
    public ResponseEntity<Void> deleteNeed(@PathVariable Long id) {
        if (needRepository.existsById(id)) {
            List<TaskAssignment> tasks = taskRepository.findByNeedId(id);
            if (!tasks.isEmpty()) {
                taskRepository.deleteAll(tasks);
            }
            needRepository.deleteById(id);
            activityLogRepository.save(new ActivityLog("NEED_DELETED", "Community need #" + id + " deleted", "NEED", id));
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @Transactional
    @DeleteMapping("/volunteers/{id}")
    public ResponseEntity<Void> deleteVolunteer(@PathVariable Long id) {
        if (volunteerRepository.existsById(id)) {
            List<TaskAssignment> tasks = taskRepository.findByVolunteerId(id);
            if (!tasks.isEmpty()) {
                taskRepository.deleteAll(tasks);
            }
            volunteerRepository.deleteById(id);
            activityLogRepository.save(new ActivityLog("VOLUNTEER_DELETED", "Volunteer #" + id + " deleted", "VOLUNTEER", id));
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @Transactional
    @DeleteMapping("/surveys/{id}")
    public ResponseEntity<Void> deleteSurvey(@PathVariable Long id) {
        if (surveyRepository.existsById(id)) {
            surveyRepository.deleteById(id);
            activityLogRepository.save(new ActivityLog("SURVEY_DELETED", "Paper survey scan #" + id + " deleted", "SURVEY", id));
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
