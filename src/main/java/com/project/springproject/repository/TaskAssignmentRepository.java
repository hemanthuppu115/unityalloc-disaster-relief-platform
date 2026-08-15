package com.project.springproject.repository;

import com.project.springproject.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    List<TaskAssignment> findByVolunteerId(Long volunteerId);
    List<TaskAssignment> findByNeedId(Long needId);
}
