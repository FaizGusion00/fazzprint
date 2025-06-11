# 🎽 FazzPrint Shirt Printing Management ERP System - Laravel (Sanchum API)

A specialized ERP system tailored for managing shirt printing operations using Laravel. The system is divided into **4 separate role-based portals**, all connected to a **single centralized database** for real-time updates and automation.

---

## 🌐 1. Customer Site

### Features:
- **Homepage**:  
  An attractive, responsive, and modern homepage that promotes company services and offerings.

- **Authentication**:
  - **Register**: Users can register with the following info: `Username`, `Full Name`, `Email`, `Phone Number`, `Address`, `Password`.  
    _📌 No email verification required (for now)._
  - **Login**: Users can log in using **email / username / phone number + password**.  
    _Includes "Remember Me" functionality (local storage)._

- **Dashboard**:
  - View recent orders, total orders, and statistics through modern and responsive charts 📊.

- **Create Order**:
  - Customers can place orders with detailed descriptions.
  - Upload files (images, Photoshop designs, etc.) to support custom designs.

- **Track Order**:
  - Monitor real-time order status and updates.

- **Order History**:
  - Browse past orders and activity.

- **Account Settings**:
  - Edit personal information as needed.

---

## 🛠️ 2. Admin Site

### Features:
- Full control over the system including users (customers, staff, managers), settings, roles, and configurations.
- Centralized dashboard with analytics and reporting.
- The most powerful backend role for system oversight. 👑

---

## 📦 3. Sales Manager Site

### Features:
- **Authentication**: Secure login.
- **Dashboard**: Overview of job orders and order statuses.
- **Job Management**:
  - Create, update, delete jobs based on incoming orders.
  - Set job status to `DRAFT`, which then appears on the Customer portal under **Track Order** in real-time.
- **Order Management**:
  - View order details.
  - Generate and print QR codes to be passed to staff for job initiation.
- **Settings**: Profile and role configuration.

⚙️ This role acts as the bridge between customer orders and staff execution.

---

## 👨‍🔧 4. Staff Site

### Features:
- **Authentication**: Secure login.
- **Dashboard**: View assigned jobs.
- **Job Execution**:
  - Scan QR code provided by the Sales Manager to retrieve job ID.
  - Fill in job form (`Staff Name`, `Staff ID`, `Start Quantity`, current `Date` & `Time`, etc.).
  - Click **START**: Timer and system begin capturing critical data (`start_time`, `PIC`, `start_quantity`, etc.).
  - Click **END**: System captures `end_quantity`, `rejected quantity`, remarks, etc.
- Job status automatically updates to `IN PROGRESS`, `COMPLETED`, etc., with **real-time synchronization** to Customer and Sales Manager portals.

📌 The job timer continues to run based on database timestamps even if the staff site is closed, ensuring accuracy.

---

## 🤖 Automation: Process Management Module

### System Responsibilities:
- 📬 **Email Notifications**: Automatically notify customers on each order status update.
- 🔄 **Data Flow Management**:
  - Seamlessly pass orders from Customer to Sales Manager.
  - Generate and send QR codes & job IDs to Staff.
- 📈 **Real-Time Sync**:
  - Update jobs and order statuses dynamically across all portals.
- 🔐 **Information Control**:
  - Control and filter what data is visible to customers.

---

## 🧩 System Architecture

- Each portal (Customer, Admin, Sales Manager, Staff) is hosted separately for role-specific access.
- All sites share **a single database** to ensure consistency and seamless data exchange.
- Backend services may optionally be managed via a centralized controller (could be a dedicated Laravel backend or middleware API).
- Plan B: Use Docker + phpMyAdmin for database setup and direct integration.

---

> ⚠️ **Note**: This system is designed for scalability and modular ERP use. Role-specific portals are critical for specialized access and workflow control.

--- ALways run with docker exec -it fazzprint_api