-- FAZZPRINT ERP Database Schema
-- This script creates all tables and relationships for the ERP system
-- Version: 1.0
-- Developed by: Faiz Nasir
-- Date: 10-06-2025
-- Database: fazzprint_erp
-- =============================================

-- Create the Users table to store all types of users: customers, sales managers, staff, and admin
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('customer', 'sales_manager', 'staff', 'admin') NOT NULL
);

-- Create the Job_Orders table to store job order details
CREATE TABLE Job_Orders (
    job_order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,  -- Links to the customer who created the job order
    started_by INT,            -- Links to the sales manager who started the job order
    status ENUM('draft', 'started', 'completed') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_order_url VARCHAR(255) UNIQUE,
    FOREIGN KEY (customer_id) REFERENCES Users(user_id),
    FOREIGN KEY (started_by) REFERENCES Users(user_id)
);

-- Create the Process_Steps table to define the sequence of steps for each job order
CREATE TABLE Process_Steps (
    step_id INT PRIMARY KEY AUTO_INCREMENT,
    job_order_id INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_order INT NOT NULL,  -- Defines the sequence of steps
    FOREIGN KEY (job_order_id) REFERENCES Job_Orders(job_order_id)
);

-- Ensure step_order is unique within a job_order_id to maintain sequence integrity
ALTER TABLE Process_Steps ADD CONSTRAINT unique_step_order UNIQUE (job_order_id, step_order);

-- Create the Processes table to track the execution of each process step
CREATE TABLE Processes (
    process_id INT PRIMARY KEY AUTO_INCREMENT,
    step_id INT NOT NULL,
    pic_id INT NOT NULL,  -- Links to the staff member (Person-in-Charge)
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    start_quantity INT,
    end_quantity INT,
    reject_quantity INT,
    status ENUM('in progress', 'completed') NOT NULL DEFAULT 'in progress',
    remark TEXT,
    FOREIGN KEY (step_id) REFERENCES Process_Steps(step_id),
    FOREIGN KEY (pic_id) REFERENCES Users(user_id)
);

-- Create the Notifications table to log email notifications
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    job_order_id INT NOT NULL,
    recipient_id INT NOT NULL,  -- Links to the recipient (customer, sales manager, staff, or admin)
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_order_id) REFERENCES Job_Orders(job_order_id),
    FOREIGN KEY (recipient_id) REFERENCES Users(user_id)
);

-- Create the QR_Codes table to store QR code details for each job order
CREATE TABLE QR_Codes (
    qr_code_id INT PRIMARY KEY AUTO_INCREMENT,
    job_order_id INT NOT NULL UNIQUE,  -- Ensures one-to-one relationship with Job_Orders
    qr_code_value VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (job_order_id) REFERENCES Job_Orders(job_order_id)
);

-- Create the Order_Tracking table to allow admin to manage and track orders
CREATE TABLE Order_Tracking (
    tracking_id INT PRIMARY KEY AUTO_INCREMENT,
    job_order_id INT NOT NULL,
    admin_id INT NOT NULL,  -- Links to the admin managing the order
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_update VARCHAR(255),
    FOREIGN KEY (job_order_id) REFERENCES Job_Orders(job_order_id),
    FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

-- Create the Customer_Management table to allow admin to manage customers
CREATE TABLE Customer_Management (
    management_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,  -- Links to the customer being managed
    admin_id INT NOT NULL,    -- Links to the admin managing the customer
    managed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_taken VARCHAR(255),
    FOREIGN KEY (customer_id) REFERENCES Users(user_id),
    FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

-- Create the Order_Files table to store uploaded files/images for each job order
CREATE TABLE Order_Files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    job_order_id INT NOT NULL,  -- Links to the job order with which the file is associated
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,  -- Stores the server path or URL to the file
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_type VARCHAR(50),  -- e.g., 'image/jpeg', 'application/pdf'
    uploaded_by INT NOT NULL,  -- Links to the user who uploaded the file
    FOREIGN KEY (job_order_id) REFERENCES Job_Orders(job_order_id),
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)
);