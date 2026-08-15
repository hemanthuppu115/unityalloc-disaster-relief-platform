# 🌿 UnityAlloc — Smart Volunteer Coordination & Resource Allocation Platform

[![Vercel Production](https://img.shields.io/badge/Vercel-Live--Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://unityalloc-disaster-relief-platform.vercel.app/)
[![Spring Boot](https://img.shields.io/badge/Spring--Boot-3.4+-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=for-the-badge&logo=java&logoColor=white)](https://www.oracle.com/java/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> 🚀 **Live Production Web Application:** **[https://unityalloc-disaster-relief-platform.vercel.app/](https://unityalloc-disaster-relief-platform.vercel.app/)**

**UnityAlloc** is an intelligent, full-stack disaster response and volunteer coordination platform. It bridges ground emergency reports with command decisions by digitizing physical paper surveys, tracking medical supply inventory in real-time, and using a 3-factor AI matching engine to dispatch frontline volunteers based on proximity, skills compatibility, and urgency.

---

## ✨ Key Features

### 1. 🛡️ Role-Based Dashboard Systems
- **Field Volunteer Responder Portal:** Dedicated dashboard for frontline volunteers featuring personal active task status steppers (`ACCEPTED` ➔ `EN_ROUTE 🚚` ➔ `ON_SITE 📍` ➔ `COMPLETED ✅`), contribution statistics, and nearby emergency maps.
- **Command Lead Dispatcher HQ:** Operational control room featuring urgency metrics, real-time activity stream, volunteer roster management, stock depot alerts, and AI dispatch controls.

### 2. 🧠 AI Smart Match Engine
- Evaluates candidate volunteers using a multi-factor scoring algorithm:
  - **Proximity Distance Score (40%)**
  - **Skill Fit Compatibility (40%)**
  - **Emergency Task Urgency (20%)**
- Provides single-click auto-dispatch with real-time candidate score ranking.

### 3. 📄 Paper Survey OCR Ingestion
- Digitizes physical paper disaster reports and handwritten field surveys into structured digital emergency needs within seconds.

### 4. 🗺️ Live GIS Relief Map & Stock Depot
- **GIS Mapping:** Interactive spatial Leaflet map displaying emergency pins, active responder positions, and medical supply inventory depots.
- **Relief Stock Depot:** Tracks Type-D oxygen cylinders, medical trauma kits, meal boxes, and blood unit availability with threshold alerts.

### 5. 🏠 Public Landing Page & Interactive Simulator
- Feature-rich home page with an **Interactive AI Skill Match Simulator** widget allowing visitors to calculate their volunteer compatibility fit score and estimated response dispatch times.

---

## 🛠️ Technology Stack

* **Backend:** Java 21, Spring Boot 4.1.0, Spring Data JPA, Hibernate, JWT Authentication, Spring Security
* **Database:** MySQL 8.0+ / H2 In-Memory Database
* **Frontend:** HTML5, Vanilla JavaScript (ES6+ Single Page Application), Custom Glassmorphism CSS3 Design System
* **Libraries:** Leaflet.js (GIS Maps), FontAwesome 6, Google Fonts (Inter, Spline Sans Mono)
* **Build Tool:** Apache Maven (`./mvnw`)

---

## 🚀 Quick Start & Running Locally

### Prerequisites
* JDK 21 or higher
* MySQL Server 8.0+

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SevaSetu-Smart-Volunteer-Platform.git
   cd SevaSetu-Smart-Volunteer-Platform
   ```

2. **Configure Database Connection:**
   Update `src/main/resources/application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/volunteer_db?createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

3. **Build & Run Application:**
   ```bash
   # On Windows PowerShell / CMD:
   .\mvnw.cmd spring-boot:run

   # On Linux / macOS:
   ./mvnw spring-boot:run
   ```

4. **Access Web Application:**
   Open your browser and navigate to:
   ```text
   http://localhost:8081/
   ```

---

## 🔐 Default Demo Accounts

| Role | Email | Default Dashboard |
| :--- | :--- | :--- |
| **Command Lead Dispatcher** | `admin@resq.org` | Dispatcher Command HQ |
| **Field Volunteer Responder** | `ravi.kumar@volunteer.org` | My Responder Portal |

---

## 📜 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
