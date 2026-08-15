package com.project.springproject.repository;

import com.project.springproject.model.PaperSurvey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperSurveyRepository extends JpaRepository<PaperSurvey, Long> {
    List<PaperSurvey> findByVerificationStatus(String verificationStatus);
    List<PaperSurvey> findBySurveyNumberContainingIgnoreCaseOrExtractedJsonContainingIgnoreCase(String surveyNumber, String extractedJson);
}
