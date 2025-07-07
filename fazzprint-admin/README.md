# 🚀 FazzPrint Admin Portal

A comprehensive administrative dashboard for FazzPrint's printing management system, built with React, TypeScript, and Tailwind CSS.

## ✨ Features

### 🔐 **Role-Based Access Control**
- **Sales Manager**: Order management, customer oversight, analytics
- **Staff**: Process management, QR scanning, task tracking
- **Admin**: Full system access with advanced controls

### 📱 **Modern & Responsive Design**
- Beautiful, minimalist UI with professional aesthetics
- Mobile-first responsive design
- Tailwind CSS for consistent styling
- Dark/light theme support (coming soon)

### 🔧 **Core Functionality**
- **Authentication**: Secure JWT-based login with role validation
- **Dashboard**: Role-specific insights and quick actions
- **Real-time Updates**: Live data synchronization
- **Session Management**: Auto-refresh and secure session handling

## 🛠️ **Technology Stack**

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router v6
- **State Management**: React Context
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📋 **Prerequisites**

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **FazzPrint Backend** running on `http://localhost:8000`

## ⚡ **Quick Start**

### 1. **Install Dependencies**
```bash
cd fazzprint-admin
npm install
```

### 2. **Environment Configuration**
```bash
# Create environment file
cp .env.example .env

# Edit the .env file with your settings
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=FazzPrint Admin Portal
VITE_APP_ENV=development
```

### 3. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## 🔑 **Demo Accounts**

For development and testing, use these demo credentials:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Sales Manager** | `sales_manager` | `password123` | Order management & analytics |
| **Staff** | `staff_user` | `password123` | Process & task management |

## 📁 **Project Structure**

```
fazzprint-admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── LoadingSpinner.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/              # Main page components
│   │   ├── LoginPage.tsx
│   │   ├── SalesManagerDashboard.tsx
│   │   └── StaffDashboard.tsx
│   ├── services/           # API services
│   │   └── api.ts
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── tailwind.config.js      # Tailwind configuration
├── vite.config.ts          # Vite configuration
└── README.md
```

## 🔐 **Authentication Flow**

1. **Login**: User enters credentials on login page
2. **Validation**: Backend validates credentials and returns JWT token
3. **Role Check**: System verifies user has admin portal access
4. **Session**: Token stored securely with auto-refresh
5. **Routing**: User redirected to role-appropriate dashboard

## 🎯 **Role-Specific Features**

### **Sales Manager Dashboard**
- 📊 Sales analytics and KPIs
- 📋 Order management and tracking
- 👥 Customer overview
- 📈 Staff performance metrics
- 🎯 Revenue insights

### **Staff Dashboard**
- ✅ Task management and tracking
- 📱 QR code scanning for processes
- ⏱️ Work time tracking
- 📋 Process management
- 📊 Personal performance metrics

## 🔧 **API Integration**

The admin portal connects to the FazzPrint backend via REST APIs:

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/profile` - Get user profile

### **Order Management**
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}` - Update order
- `POST /api/orders/{id}/start` - Start order

### **Process Management**
- `GET /api/processes` - List active processes
- `POST /api/processes/scan` - QR code scanning
- `POST /api/processes/{id}/start` - Start process
- `POST /api/processes/{id}/complete` - Complete process

## 🎨 **UI Components**

The portal uses a custom component library built with Tailwind CSS:

### **Base Components**
- `btn` - Button variants (primary, secondary, outline, etc.)
- `card` - Content containers with header/footer
- `input` - Form inputs with validation states
- `badge` - Status indicators

### **Layout Components**
- `navbar` - Top navigation bar
- `sidebar` - Side navigation (coming soon)
- `grid-responsive` - Responsive grid layouts

## 📱 **Mobile Responsiveness**

The admin portal is fully responsive with:
- **Mobile-first design** approach
- **Touch-friendly** interface elements
- **Optimized layouts** for different screen sizes
- **Safe area handling** for modern mobile devices

## 🔒 **Security Features**

- **JWT Authentication** with secure token storage
- **Role-based access control** with permission checks
- **Session management** with auto-refresh
- **API request interceptors** for authentication
- **Secure logout** with token invalidation

## 🛠️ **Development**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### **Code Quality**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting (recommended)
- **Strict mode** enabled for better error detection

## 🚀 **Deployment**

### **Production Build**
```bash
npm run build
```

### **Environment Variables for Production**
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_ENV=production
```

## 🔮 **Upcoming Features**

- 🌙 **Dark mode** theme support
- 📊 **Advanced analytics** dashboard
- 📱 **PWA capabilities** for offline usage
- 🔔 **Real-time notifications** via WebSocket
- 📸 **QR code generation** and management
- 📁 **File management** interface
- 👥 **User management** for admins
- 🎨 **Customizable themes**

## 📄 **License**

This project is part of the FazzPrint system - © 2024 FazzPrint. All rights reserved.

---

**Made with ❤️ for efficient printing workflow management** 