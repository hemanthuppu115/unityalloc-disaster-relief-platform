package com.project.springproject.config;

import com.project.springproject.model.*;
import com.project.springproject.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VolunteerRepository volunteerRepository;
    private final CommunityNeedRepository needRepository;
    private final PaperSurveyRepository surveyRepository;
    private final InventoryRepository inventoryRepository;
    private final TaskAssignmentRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, 
                      VolunteerRepository volunteerRepository,
                      CommunityNeedRepository needRepository,
                      PaperSurveyRepository surveyRepository,
                      InventoryRepository inventoryRepository,
                      TaskAssignmentRepository taskRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.volunteerRepository = volunteerRepository;
        this.needRepository = needRepository;
        this.surveyRepository = surveyRepository;
        this.inventoryRepository = inventoryRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) {
        // 1. Seed default Admin dispatcher account
        if (userRepository.findByEmail("admin@resq.org").isEmpty()) {
            String adminPassword = passwordEncoder.encode("admin123");
            User adminUser = new User(
                "NGO Lead Dispatcher",
                "admin@resq.org",
                adminPassword,
                Role.DISPATCHER,
                "+91 98101 00001",
                "Operations HQ, Resource Dispatch",
                28.6139,
                77.2090
            );
            userRepository.save(adminUser);
        }

        // 2. Seed Realistic Field Volunteer Responders
        if (volunteerRepository.count() == 0) {
            volunteerRepository.save(new Volunteer(
                "Ravi Kumar",
                "+91 98765 43210",
                "Medical Aid, First Aid, CPR, Trauma Support",
                28.6139,
                77.2090,
                true,
                0,
                4.9
            ));

            volunteerRepository.save(new Volunteer(
                "Ananya Sharma",
                "+91 98123 45678",
                "Food Distribution, Relief Supply Logistics, Shelter Management",
                28.6225,
                77.2612,
                true,
                0,
                4.8
            ));

            volunteerRepository.save(new Volunteer(
                "Vikram Singh",
                "+91 98999 11223",
                "Emergency Transport, Heavy Vehicle Driving, Search & Rescue, Logistics",
                28.5693,
                77.2427,
                true,
                0,
                4.9
            ));

            volunteerRepository.save(new Volunteer(
                "Priya Patel",
                "+91 98450 67890",
                "Pediatric Care, Nursing, Medical Aid, Elder Care",
                28.5421,
                77.2643,
                true,
                0,
                4.7
            ));

            volunteerRepository.save(new Volunteer(
                "Arjun Mehta",
                "+91 98333 88990",
                "Water Purification, Sanitation, Debris Clearance, Logistics",
                28.6469,
                77.3161,
                true,
                0,
                4.9
            ));
        }

        // 3. Seed Realistic Disaster Community Emergency Needs & SocioNet Drives
        taskRepository.deleteAllInBatch();
        needRepository.deleteAllInBatch();

        needRepository.save(new CommunityNeed(
            "AIIMS Trauma Relief Shelter - Oxygen & Blood Supply",
            "Urgent request for 20 Type-D Oxygen Cylinders and 4 Units O-Negative Blood Packets for emergency victims.",
            "Medical",
            "CRITICAL",
            28.5672,
            77.2100,
            "PENDING",
            "AIIMS Trauma Wing, Ring Road, Delhi",
            96
        ));

        needRepository.save(new CommunityNeed(
            "Fortis Emergency Care - 4 Units B-Positive Blood Needed",
            "Critical surgery in progress. Requesting B-Positive blood donors to report immediately to Blood Bank Wing B.",
            "Medical",
            "CRITICAL",
            28.5421,
            77.2643,
            "PENDING",
            "Fortis Escorts Heart Institute, Okhla Road, Delhi",
            95
        ));

        needRepository.save(new CommunityNeed(
            "Yamuna Bank Relief Camp - Clean Water & Rations",
            "Severe water contamination reported. Requesting 500L clean drinking water cans, ORS packets, and dry rations.",
            "Food & Water",
            "CRITICAL",
            28.6225,
            77.2612,
            "PENDING",
            "Yamuna Bank Metro Relief Ground, East Delhi",
            91
        ));

        needRepository.save(new CommunityNeed(
            "Grand Plaza Kitchen - 120 Fresh Surplus Meals Available",
            "120 freshly prepared rice & dal meal boxes available for immediate redistribution to nearby relief camps.",
            "Food & Water",
            "HIGH",
            28.6310,
            77.2190,
            "PENDING",
            "Grand Plaza Banquet Kitchen, Connaught Place, Delhi",
            88
        ));

        needRepository.save(new CommunityNeed(
            "City Bakery & Caterers - 50 Bread Packs & Milk",
            "50 family-size bread loaves and 40L packaged milk ready for NGO pickup before 10 PM.",
            "Food & Water",
            "MEDIUM",
            28.5700,
            77.2300,
            "PENDING",
            "City Bakery Depot, Lajpat Nagar 2, Delhi",
            78
        ));

        needRepository.save(new CommunityNeed(
            "Anand Vihar Transit Center - Waterproof Tarps & Blankets",
            "Over 150 displaced families awaiting shelter. Urgent requirement for heavy-duty plastic tarp sheets and thermal blankets.",
            "Shelter",
            "MEDIUM",
            28.6469,
            77.3161,
            "PENDING",
            "Anand Vihar ISBT Sector, Delhi",
            82
        ));

        needRepository.save(new CommunityNeed(
            "Lajpat Nagar Ring Road - Debris & Tree Clearance",
            "Fallen trees and storm debris blocking emergency vehicle access to Ward 5 Primary Clinic.",
            "Logistics",
            "LOW",
            28.5693,
            77.2427,
            "PENDING",
            "Lajpat Nagar Central Market Crossing, Delhi",
            65
        ));

        // 4. Seed Realistic Paper Survey Ingestion Scans
        if (surveyRepository.count() == 0) {
            surveyRepository.save(new PaperSurvey(
                "SRV-FLD-8902",
                "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
                "{\"location\":\"Rohini Sector 7 Relief Camp\",\"category\":\"Medical\",\"urgency_score\":94,\"description\":\"Critical shortage of insulin, pediatric antibiotics, and sterile trauma dressings following flash flood inundation.\",\"surveyor\":\"Ground Recon Unit Alpha-1\",\"contact\":\"+91 98700 11223\"}",
                "PENDING_REVIEW"
            ));

            surveyRepository.save(new PaperSurvey(
                "SRV-FLD-8905",
                "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&auto=format&fit=crop&q=80",
                "{\"location\":\"Kashmere Gate Old City Shelter\",\"category\":\"Food & Water\",\"urgency_score\":85,\"description\":\"Community kitchen ran out of LPG cylinders and clean water bottles. 300 elderly residents awaiting meal packs.\",\"surveyor\":\"Mobile Survey Unit Bravo\",\"contact\":\"+91 98700 44556\"}",
                "PENDING_REVIEW"
            ));
        }

        // 5. Seed Realistic Relief Supplies Inventory Stock
        if (inventoryRepository.count() == 0) {
            inventoryRepository.save(new InventoryItem("Type-D Medical Oxygen Cylinders", "Medical", 8, "Cylinders", 15, "AIIMS Trauma Depot"));
            inventoryRepository.save(new InventoryItem("Emergency Ration Meal Boxes", "Food & Water", 450, "Packets", 100, "Central Relief Kitchen"));
            inventoryRepository.save(new InventoryItem("Purified Water Bottles (2L)", "Food & Water", 120, "Bottles", 200, "Yamuna Bank Hub"));
            inventoryRepository.save(new InventoryItem("O-Negative Blood Packets", "Blood", 3, "Units", 10, "Red Cross Blood Bank"));
            inventoryRepository.save(new InventoryItem("Heavy-Duty Waterproof Tarps", "Shelter", 65, "Sheets", 50, "Anand Vihar Logistics"));
            inventoryRepository.save(new InventoryItem("Trauma & First Aid Kits", "Medical", 28, "Kits", 20, "Mobile Rescue Unit 1"));
        }
    }
}
