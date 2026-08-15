package com.project.springproject.repository;

import com.project.springproject.model.CommunityNeed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityNeedRepository extends JpaRepository<CommunityNeed, Long> {
    List<CommunityNeed> findByStatus(String status);
    List<CommunityNeed> findByUrgency(String urgency);
    List<CommunityNeed> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrAddressContainingIgnoreCase(String title, String category, String address);
}
