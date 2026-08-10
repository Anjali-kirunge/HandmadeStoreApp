# Handmade Store 🎁

A full-stack e-commerce application for handmade and artisanal goods. 
This project uses **Spring Boot (Java)** for the backend and **React (Vite)** for the frontend.

## 🛠 Prerequisites
- **Node.js** (v18+)
- **Java** (v21+)
- **Maven**
- **MySQL** (Running locally on port 3306)

---

## 🚀 Setup Instructions

### 1. Database Setup
1. Open your MySQL client or CLI.
2. Create the database: 
   ```sql
   CREATE DATABASE handmadestore;
   ```
3. Make sure you know your MySQL root username and password.

### 2. Backend Configuration
1. Navigate to the backend resources directory:
   ```bash
   cd backend/src/main/resources
   ```
2. Copy the example configuration file:
   ```bash
   cp application.yml.example application.yml
   ```
3. Open `application.yml` and replace the placeholder variables with your actual credentials:
   - `spring.datasource.password`: Your MySQL password.
   - `jwt.secret`: Ask the project owner for the 256-bit secret key.
   - Add your Razorpay, Cloudinary, and Gmail SMTP passwords if you plan on testing payments, uploads, or emails.

### 3. Running the Backend
From the root directory of the project, open a terminal and run:
```bash
cd backend
mvn spring-boot:run
```
The backend API will start on `http://localhost:8080`.

### 4. Running the Frontend
Open a *new* terminal window from the project root and run:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 🔒 Security Notice
**Do not commit `application.yml` or `.env` files to this repository.**
They have been explicitly added to `.gitignore` to prevent secret leakage. Ask the repository owner for the `secrets_to_share.txt` file to get the development keys.
