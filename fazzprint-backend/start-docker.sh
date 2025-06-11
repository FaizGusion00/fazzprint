#!/bin/bash

echo "🐳 Starting FazzPrint ERP with Docker..."

# Create storage link if it doesn't exist
if [ ! -L "public/storage" ]; then
    echo "📁 Creating storage link..."
    php artisan storage:link
fi

# Start Docker containers
echo "🚀 Starting Docker containers..."
docker-compose up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# Run migrations and seeders
echo "🔄 Running database migrations..."
docker-compose exec laravel php artisan migrate:fresh --seed

echo "✅ FazzPrint ERP is ready!"
echo ""
echo "🌐 Access points:"
echo "   • API Backend: http://localhost:8000"
echo "   • phpMyAdmin: http://localhost:8080"
echo "   • API Documentation: http://localhost:8000/api/status"
echo ""
echo "🔑 Default login credentials:"
echo "   • Customer: customer@test.com / password123"
echo "   • Sales Manager: sales@test.com / password123"  
echo "   • Staff: staff@test.com / password123"
echo "   • Admin: admin@test.com / password123"
echo ""
echo "📚 Database access (phpMyAdmin):"
echo "   • Server: mysql"
echo "   • Username: root"
echo "   • Password: root123"
echo "   • Database: fazzprint_erp" 