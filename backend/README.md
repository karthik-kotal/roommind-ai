# Roommind AI — Backend Foundation (Phase 1)

Clean Spring Boot 3 + Java 21 REST API foundation for the Roommind AI Spatial Architecture Platform.

---

## Technical Stack

* **Language:** Java 21 (OpenJDK)
* **Framework:** Spring Boot 3.2.5
* **Security:** Spring Security 6 + Stateless JWT (`jjwt 0.12.5`) + BCrypt Password Encoding
* **Database & ORM:** PostgreSQL 16 / H2 (Development & Test Profile) + Spring Data JPA
* **Migrations:** Flyway DB (`V1__init_schema.sql`)
* **API Documentation:** OpenAPI 3 / Swagger UI (`springdoc-openapi-starter-webmvc-ui 2.5.0`)
* **Build Tool:** Maven 3.9+ Wrapper (`mvnw.cmd` / `./mvnw`)

---

## Directory & Package Architecture

```
roommind-ai/backend/
├── docker-compose.yml
├── pom.xml
├── mvnw.cmd
├── .mvn/wrapper/
├── README.md
└── src/
    ├── main/
    │   ├── java/com/roommind/backend/
    │   │   ├── config/
    │   │   │   ├── OpenApiConfig.java
    │   │   │   ├── SecurityConfig.java
    │   │   │   └── WebConfig.java (CORS)
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   └── UserController.java
    │   │   ├── dto/
    │   │   │   ├── AuthResponse.java
    │   │   │   ├── ErrorResponse.java
    │   │   │   ├── LoginRequest.java
    │   │   │   ├── RegisterRequest.java
    │   │   │   ├── UpdateProfileRequest.java
    │   │   │   └── UserProfileResponse.java
    │   │   ├── entity/
    │   │   │   ├── Role.java
    │   │   │   └── User.java
    │   │   ├── exception/
    │   │   │   ├── BadRequestException.java
    │   │   │   ├── DuplicateResourceException.java
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   └── ResourceNotFoundException.java
    │   │   ├── repository/
    │   │   │   └── UserRepository.java
    │   │   ├── security/
    │   │   │   ├── CustomUserDetailsService.java
    │   │   │   ├── JwtAuthenticationEntryPoint.java
    │   │   │   ├── JwtAuthenticationFilter.java
    │   │   │   └── JwtTokenProvider.java
    │   │   └── service/
    │   │       ├── AuthService.java
    │   │       └── UserService.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-test.yml
    │       └── db/migration/
    │           └── V1__init_schema.sql
    └── test/
        └── java/com/roommind/backend/
            └── AuthIntegrationTest.java
```

---

## API Specification

### 1. User Registration
* **Endpoint:** `POST /api/auth/register`
* **Access:** Public
* **Request Body:**
```json
{
  "email": "karthik@roommind.ai",
  "password": "Password123!",
  "fullName": "Karthik",
  "phone": "+919876543210"
}
```
* **Response:** `HTTP 201 Created`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "karthik@roommind.ai",
    "fullName": "Karthik",
    "phone": "+919876543210",
    "bio": null,
    "role": "ROLE_USER",
    "createdAt": "2026-10-06T00:00:00Z",
    "updatedAt": "2026-10-06T00:00:00Z"
  }
}
```

### 2. User Login
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
```json
{
  "email": "karthik@roommind.ai",
  "password": "Password123!"
}
```
* **Response:** `HTTP 200 OK` (Returns JWT Bearer Token)

### 3. Get Authenticated Profile
* **Endpoint:** `GET /api/users/me`
* **Access:** Protected (`Authorization: Bearer <token>`)
* **Response:** `HTTP 200 OK` (User profile object; password is NEVER returned)

### 4. Update Profile
* **Endpoint:** `PUT /api/users/me`
* **Access:** Protected (`Authorization: Bearer <token>`)
* **Request Body:**
```json
{
  "fullName": "Karthik R",
  "phone": "+919876543210",
  "bio": "Lead Architect & Spatial Designer"
}
```

---

## Database Migration Schema (`V1__init_schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    bio TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## Quickstart Guide

### Option A: Using PostgreSQL with Docker Compose (Recommended)

1. **Start PostgreSQL Container:**
   ```bash
   docker-compose up -d
   ```

2. **Configure Environment Variables (Optional override):**
   ```powershell
   $env:SPRING_PROFILES_ACTIVE="prod"
   $env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/roommind_db"
   $env:SPRING_DATASOURCE_USERNAME="postgres"
   $env:SPRING_DATASOURCE_PASSWORD="postgrespassword"
   $env:JWT_SECRET="404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971"
   ```

3. **Run Spring Boot Application:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

### Option B: Quick Development Run (H2 In-Memory Profile)

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## Testing & Verification

Run the full automated integration test suite:

```powershell
.\mvnw.cmd test
```

---

## OpenAPI / Swagger UI Interactive Documentation

Once the server is running on port 8080:
* **Interactive UI:** `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3 JSON:** `http://localhost:8080/v3/api-docs`
