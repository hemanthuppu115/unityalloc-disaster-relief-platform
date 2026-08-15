package com.project.springproject.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_needs")
public class CommunityNeed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String category; // Medical, Food & Water, Shelter, Logistics

    private String urgency; // CRITICAL, MEDIUM, LOW

    private Double latitude;

    private Double longitude;

    private String status; // PENDING, VERIFIED, IN_PROGRESS, RESOLVED

    private String address;

    private Integer urgencyScore; // 1-100

    private LocalDateTime createdAt;

    public CommunityNeed() {
        this.createdAt = LocalDateTime.now();
    }

    public CommunityNeed(String title, String description, String category, String urgency, Double latitude, Double longitude, String status, String address, Integer urgencyScore) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.urgency = urgency;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.address = address;
        this.urgencyScore = urgencyScore;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Integer getUrgencyScore() { return urgencyScore; }
    public void setUrgencyScore(Integer urgencyScore) { this.urgencyScore = urgencyScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
