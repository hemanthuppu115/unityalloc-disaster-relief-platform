package com.project.springproject.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_assignments")
public class TaskAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long needId;

    private Long volunteerId;

    private String status; // ACCEPTED, EN_ROUTE, ON_SITE, IN_PROGRESS, COMPLETED

    private Double matchScore;

    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime enRouteAt;
    private LocalDateTime onSiteAt;
    private LocalDateTime inProgressAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;

    public TaskAssignment() {
        this.assignedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public TaskAssignment(Long needId, Long volunteerId, String status, Double matchScore) {
        this.needId = needId;
        this.volunteerId = volunteerId;
        this.status = status;
        this.matchScore = matchScore;
        this.assignedAt = LocalDateTime.now();
        this.acceptedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNeedId() { return needId; }
    public void setNeedId(Long needId) { this.needId = needId; }

    public Long getVolunteerId() { return volunteerId; }
    public void setVolunteerId(Long volunteerId) { this.volunteerId = volunteerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status; 
        this.updatedAt = LocalDateTime.now();
    }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getEnRouteAt() { return enRouteAt; }
    public void setEnRouteAt(LocalDateTime enRouteAt) { this.enRouteAt = enRouteAt; }

    public LocalDateTime getOnSiteAt() { return onSiteAt; }
    public void setOnSiteAt(LocalDateTime onSiteAt) { this.onSiteAt = onSiteAt; }

    public LocalDateTime getInProgressAt() { return inProgressAt; }
    public void setInProgressAt(LocalDateTime inProgressAt) { this.inProgressAt = inProgressAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
