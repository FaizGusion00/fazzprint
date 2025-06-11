# FazzPrint ERP Backend System

A powerful Laravel-based backend system for managing shirt printing operations with role-based access control, real-time order tracking, and automated workflow management.

## 🚀 Features

### Core System
- **Role-Based Authentication**: 4 distinct user roles (Customer, Sales Manager, Staff, Admin)
- **Real-time Order Tracking**: Live updates on printing progress
- **QR Code Integration**: Staff can scan QR codes to start/manage processes
- **Automated Notifications**: Email and system notifications for status changes
- **File Management**: Upload and manage design files, images, and documents
- **Process Timer**: Persistent timer system that continues even after browser close

### User Roles & Capabilities

#### 👤 **Customer**
- Create and submit print orders
- Upload design files and requirements
- Track order progress in real-time
- View order history and details
- Receive automated status notifications

#### 💼 **Sales Manager**
- Review and approve customer orders
- Create job orders from customer requests
- Generate QR codes for production workflow
- Manage order priorities and scheduling
- Monitor overall production progress

#### ⚙️ **Staff**
- Scan QR codes to access job details
- Start/stop process timers
- Record production quantities and quality metrics
- Mark process steps as complete
- Add remarks and notes for quality tracking

#### 👑 **Admin**
- Full system access and oversight
- User management and role assignment
- System analytics and reporting
- Customer relationship management
- Order and process monitoring

## 📊 Database Schema

The system uses 8 main tables with proper relationships and constraints:

- **users**: All system users with role-based access
- **job_orders**: Customer orders and their details
- **process_steps**: Workflow steps for each order
- **processes**: Individual staff work sessions with timing
- **q_r_codes**: QR codes for staff workflow integration
- **notifications**: System and email notifications
- **order_trackings**: Real-time status tracking
- **customer_management**: Customer statistics and management
- **order_files**: File uploads and attachments

## 🛠️ Installation & Setup

### 🐳 Option 1: Docker Setup (Recommended)

**Prerequisites:**
- Docker & Docker Compose
- Git

**🚀 One-Click Setup:**

**For Windows (PowerShell):**
```powershell
./start-docker.ps1
```

**For Linux/Mac:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

**Manual Docker Setup:**
```bash
# 1. Start Docker containers
docker-compose up -d

# 2. Wait for MySQL (30 seconds), then run migrations
docker-compose exec laravel php artisan migrate:fresh --seed

# 3. Create storage link
docker-compose exec laravel php artisan storage:link
```

**🌐 Access Points:**
- **API Backend**: http://localhost:8000
- **phpMyAdmin**: http://localhost:8080 (root/root123)
- **API Status**: http://localhost:8000/api/status

### 🖥️ Option 2: Local Setup

**Prerequisites:**
- PHP 8.1+
- MySQL 8.0+
- Composer
- Laravel Sanctum for API authentication

```bash
# 1. Clone and install
git clone <repository-url>
cd fazzprint-backend
composer install

# 2. Environment configuration
cp .env.example .env
php artisan key:generate

# 3. Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fazzprint_erp
DB_USERNAME=root
DB_PASSWORD=your_password

# 4. Database setup
mysql -u root -p -e "CREATE DATABASE fazzprint_erp;"
php artisan migrate:fresh --seed

# 5. Storage setup and start server
php artisan storage:link
php artisan serve
```

## 🔐 Default Login Credentials

After seeding, you can use these accounts for testing:

| Role | Email | Password | Login Methods |
|------|--------|----------|---------------|
| **Admin** | admin@test.com | password123 | Email, Username: admin_user |
| **Sales Manager** | sales@test.com | password123 | Email, Username: sales_manager |
| **Staff** | staff@test.com | password123 | Email, Username: staff_user |
| **Customer** | customer@test.com | password123 | Email, Username: customer_user |

**🔑 Multi-Login Support:**
- Login with **email**, **username**, or **phone number**
- API Authentication via **Bearer tokens** (Laravel Sanctum)
- Remember me functionality for extended sessions

## 🏗️ Architecture Overview

### Service Layer
- **ProcessManagementService**: Core business logic for order and process management
- Handles automated notifications and status updates
- Manages QR code generation and validation
- Controls workflow transitions and validations

### Models & Relationships
All models include proper Eloquent relationships and business logic methods:
- Status checking methods (`isCompleted()`, `isInProgress()`, etc.)
- Progress calculation and tracking
- Automated timestamp management
- Data validation and casting

### Security Features
- Role-based middleware for route protection
- Encrypted QR code data
- Password hashing with bcrypt
- CSRF protection on all forms
- SQL injection prevention through Eloquent ORM

## 📱 Frontend Integration

The backend is designed to support 4 separate frontend applications:

1. **Customer Site**: Order creation and tracking
2. **Sales Manager Site**: Order management and approval
3. **Staff Site**: QR code scanning and process management
4. **Admin Site**: System administration and oversight

### 🔌 API Architecture

The backend is built as a **REST API** using **Laravel Sanctum** for authentication, perfect for 4 separate frontend applications:

#### Authentication Endpoints
```bash
POST /api/auth/login          # Login with email/username/phone
POST /api/auth/register       # Customer registration
GET  /api/auth/profile        # Get user profile
PUT  /api/auth/profile        # Update profile
POST /api/auth/logout         # Logout current device
POST /api/auth/logout-all     # Logout all devices
GET  /api/auth/check-role/{role} # Check user role
```

#### Order Management API
```bash
GET  /api/orders              # Get orders (role-filtered)
POST /api/orders              # Create order (customers only)
GET  /api/orders/{id}         # Get order details
PUT  /api/orders/{id}         # Update order
POST /api/orders/{id}/start   # Start order (sales managers)
POST /api/orders/{id}/cancel  # Cancel order
POST /api/orders/{id}/upload  # Upload files
GET  /api/orders/statistics   # Order statistics
```

#### Process Management API (Staff)
```bash
GET  /api/processes           # Active processes
GET  /api/processes/available # Available QR codes
POST /api/processes/scan      # Scan QR code
POST /api/processes/{id}/start     # Start process
POST /api/processes/{id}/pause     # Pause process
POST /api/processes/{id}/resume    # Resume process
POST /api/processes/{id}/complete  # Complete process
GET  /api/processes/{id}/status    # Process status
PUT  /api/processes/{id}/update-quantity # Update quantity
```

#### QR Code Management API
```bash
GET  /api/qr-codes            # List QR codes
POST /api/qr-codes/generate/{orderId} # Generate QR
GET  /api/qr-codes/{code}/validate    # Validate QR
GET  /api/qr-codes/{code}/info        # QR info
POST /api/qr-codes/{code}/regenerate  # Regenerate QR
```

#### Notifications API
```bash
GET  /api/notifications       # User notifications
GET  /api/notifications/unread # Unread count
POST /api/notifications/{id}/read # Mark as read
POST /api/notifications/read-all  # Mark all read
DELETE /api/notifications/{id}    # Delete notification
```

#### Role-Specific Endpoints
```bash
# Admin only
GET  /api/admin/users         # All users
POST /api/admin/users/{id}/role # Update user role
GET  /api/admin/system-stats  # System statistics

# Sales Manager
GET  /api/sales/pending-orders # Pending orders
POST /api/sales/assign-staff/{orderId} # Assign staff
GET  /api/sales/staff-performance # Performance stats

# Staff
GET  /api/staff/my-tasks      # Current tasks
GET  /api/staff/work-history  # Work history
POST /api/staff/clock-in      # Clock in
POST /api/staff/clock-out     # Clock out

# Customer
GET  /api/customer/my-orders  # Customer orders
GET  /api/customer/order-history # Order history
POST /api/customer/reorder/{orderId} # Reorder
```

#### Authentication Headers
All protected endpoints require:
```bash
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 🔄 Workflow Process

### Order Lifecycle
1. **Customer** creates order with requirements
2. **System** auto-creates process steps and notifications
3. **Sales Manager** reviews and approves order
4. **System** generates QR code and starts production queue
5. **Staff** scans QR code and starts process steps
6. **System** tracks progress and sends real-time updates
7. **Staff** completes steps with quantity/quality data
8. **System** auto-completes order when all steps done
9. **Customer** receives completion notification

### Real-time Features
- Database-driven timer system (persists across sessions)
- Automatic status updates based on process completion
- Live progress percentage calculation
- Email notifications for major status changes
- QR code validation and security

## 🧪 Testing

Run the test suite:
```bash
php artisan test
```

## 📝 Development Notes

### Adding New Process Steps
Process steps are automatically created for each order. To modify default steps, edit the `createDefaultProcessSteps()` method in `ProcessManagementService`.

### Customizing Notifications
Notification templates can be customized in the service methods like `sendOrderCreatedNotification()`.

### Adding New User Roles
Add new role constants to the `User` model and update the enum in the users migration.

### File Upload Handling
The system supports multiple file types with automatic type detection and icon assignment. See `OrderFile` model for supported formats.

## 🚀 Next Steps

1. **Frontend Development**: Create the 4 separate sites
2. **Email Integration**: Configure SMTP for notifications
3. **QR Code Generation**: Implement QR code image generation
4. **Reporting**: Add analytics and reporting features
5. **API Documentation**: Generate API docs with Swagger/OpenAPI

## 🤝 Contributing

1. Follow PSR-12 coding standards
2. Write comprehensive tests for new features
3. Update documentation for any changes
4. Use meaningful commit messages

## 📄 License

This project is proprietary software for FazzPrint operations.

---

**Built with ❤️ using Laravel 11**
