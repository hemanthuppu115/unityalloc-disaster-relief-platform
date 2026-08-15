package com.project.springproject.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "paper_surveys")
public class PaperSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String surveyNumber;

    private String imageUrl;

    @Column(length = 2000)
    private String extractedJson; // JSON representation of OCR/survey fields

    private String verificationStatus; // PENDING_REVIEW, VERIFIED, REJECTED

    private String reviewerNotes;

    private LocalDateTime uploadedAt;

    public PaperSurvey() {
        this.uploadedAt = LocalDateTime.now();
    }

    public PaperSurvey(String surveyNumber, String imageUrl, String extractedJson, String verificationStatus) {
        this.surveyNumber = surveyNumber;
        this.imageUrl = imageUrl;
        this.extractedJson = extractedJson;
        this.verificationStatus = verificationStatus;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSurveyNumber() { return surveyNumber; }
    public void setSurveyNumber(String surveyNumber) { this.surveyNumber = surveyNumber; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getExtractedJson() { return extractedJson; }
    public void setExtractedJson(String extractedJson) { this.extractedJson = extractedJson; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getReviewerNotes() { return reviewerNotes; }
    public void setReviewerNotes(String reviewerNotes) { this.reviewerNotes = reviewerNotes; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
