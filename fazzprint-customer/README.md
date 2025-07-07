# FazzPrint Customer Portal

A modern, responsive customer portal for FazzPrint printing services built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Authentication
- **Multi-credential login**: Email, username, or phone number
- **Secure registration** with form validation
- **JWT token management** with automatic refresh
- **Protected routes** with authentication guards

### Dashboard
- **Real-time statistics** showing order counts and status
- **Quick actions** for common tasks
- **Recent orders** overview with status indicators
- **Responsive design** optimized for all devices

### Order Management
- **Create orders** with file upload and drag-and-drop
- **Advanced filtering** and search functionality
- **Order tracking** with real-time status updates
- **Cost estimation** before order placement
- **Pagination** for large order lists

### User Experience
- **Modern UI** with professional design
- **Real-time notifications** using toast messages
- **Loading states** with spinners and skeletons
- **Error handling** with user-friendly messages
- **Form validation** with clear error messages

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state, Context API for auth
- **Forms**: React Hook Form with validation
- **File Upload**: React Dropzone
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors

## 📋 Prerequisites

- Node.js 16+ and npm
- Laravel backend API running on `http://localhost:8000`

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fazzprint-customer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   The `.env` file is pre-configured for development. To switch between development and production servers:
   
   **For Development (default):**
   ```
   VITE_USE_PROD_API=false
   VITE_API_BASE_URL_DEV=http://localhost:8000/api
   ```
   
   **For Production:**
   ```
   VITE_USE_PROD_API=true
   VITE_API_BASE_URL_PROD=https://api.fazzprint.com/api
   ```
   
   **Quick Switch:** Just change `VITE_USE_PROD_API=false` to `VITE_USE_PROD_API=true` to switch servers!

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Use demo credentials on login page or create a new account

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── LoadingSpinner.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom React hooks
│   └── useOrders.ts
├── layouts/           # Layout components
│   ├── AuthenticatedLayout.tsx
│   └── PublicLayout.tsx
├── pages/             # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── OrdersPage.tsx
│   ├── CreateOrderPage.tsx
│   ├── OrderDetailPage.tsx
│   ├── TrackOrderPage.tsx
│   ├── ProfilePage.tsx
│   └── NotificationsPage.tsx
├── services/          # API services
│   ├── api.ts
│   └── orderService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Main app component
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🔧 Centralized Configuration

The application uses a centralized configuration system for easy server switching:

### Server Configuration
- **Development Server**: `http://localhost:8000/api` (default)
- **Production Server**: `https://api.fazzprint.com/api` (configurable)
- **Switch Method**: Change `VITE_USE_PROD_API` in `.env` file

### Configuration Files
- `src/config.ts` - Centralized configuration logic
- `.env` - Environment variables (not committed)
- `.env.example` - Template for new developers

### Usage
```typescript
import { API_BASE_URL, APP_CONFIG } from '@/config'

// API_BASE_URL automatically switches based on VITE_USE_PROD_API
console.log(APP_CONFIG.isProduction) // true/false
console.log(APP_CONFIG.apiBaseUrl)   // Current API URL
```

## 🌐 API Integration

The application connects to a Laravel backend with the following key endpoints:

### Authentication
- `POST /api/auth/login` - Multi-credential login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

### Orders
- `GET /api/orders` - List orders with filtering/pagination
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}` - Update order
- `POST /api/orders/{id}/cancel` - Cancel order
- `POST /api/orders/{id}/files` - Upload order files

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Tracking
- `GET /api/track/{code}` - Track order by code

## 🎨 Design System

### Colors
- **Primary**: Blue theme (#2563eb)
- **Secondary**: Gray theme (#71717a)
- **Success**: Green (#22c55e)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)

### Components
- Custom button classes: `btn`, `btn-primary`, `btn-secondary`, etc.
- Input class: `input` with consistent styling
- Card class: `card` for content containers

## 🔐 Authentication Flow

1. **Login**: Multi-credential support (email/username/phone)
2. **Token Storage**: JWT stored in localStorage
3. **Auto-refresh**: Token validation on app load
4. **Protected Routes**: Automatic redirect to login for unauthenticated users
5. **Logout**: Clear token and redirect to login

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Sidebar**: Collapsible on mobile devices
- **Tables**: Horizontal scroll on small screens

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Configure environment variables** for production

## 🔍 Error Handling

- **API Errors**: Automatic toast notifications
- **Network Errors**: Connection status indicators
- **Form Validation**: Real-time field validation
- **404 Handling**: Fallback routes

## 📊 Performance Features

- **React Query**: Caching and background updates
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: Responsive images
- **Bundle Optimization**: Tree shaking and minification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**FazzPrint Customer Portal** - Professional printing made simple. 