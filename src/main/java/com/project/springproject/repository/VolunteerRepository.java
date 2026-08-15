package com.project.springproject.repository;

import com.project.springproject.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
    List<Volunteer> findByIsAvailable(Boolean isAvailable);
    List<Volunteer> findByNameContainingIgnoreCaseOrSkillsContainingIgnoreCase(String name, String skills);
}
