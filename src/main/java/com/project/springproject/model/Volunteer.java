package com.project.springproject.model;

import jakarta.persistence.*;

@Entity
@Table(name = "volunteers")
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String phone;

    private String skills; // Comma separated, e.g. "Paramedic, Search & Rescue, First Aid"

    private Double latitude;

    private Double longitude;

    private Boolean isAvailable;

    private Integer activeTasksCount;

    private Double rating;

    public Volunteer() {}

    public Volunteer(String name, String phone, String skills, Double latitude, Double longitude, Boolean isAvailable, Integer activeTasksCount, Double rating) {
        this.name = name;
        this.phone = phone;
        this.skills = skills;
        this.latitude = latitude;
        this.longitude = longitude;
        this.isAvailable = isAvailable;
        this.activeTasksCount = activeTasksCount;
        this.rating = rating;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Integer getActiveTasksCount() { return activeTasksCount; }
    public void setActiveTasksCount(Integer activeTasksCount) { this.activeTasksCount = activeTasksCount; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
}
