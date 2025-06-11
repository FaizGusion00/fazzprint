Write-Host "🐳 Starting FazzPrint ERP with Docker..." -ForegroundColor Green

# Create storage link if it doesn't exist
if (!(Test-Path "public/storage")) {
    Write-Host "📁 Creating storage link..." -ForegroundColor Yellow
    php artisan storage:link
}

# Start Docker containers
Write-Host "🚀 Starting Docker containers..." -ForegroundColor Blue
docker-compose up -d

# Wait for MySQL to be ready
Write-Host "⏳ Waiting for MySQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Run migrations and seeders
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
docker-compose exec laravel php artisan migrate:fresh --seed

Write-Host ""
Write-Host "✅ FazzPrint ERP is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor Magenta
Write-Host "   • API Backend: http://localhost:8000" -ForegroundColor White
Write-Host "   • phpMyAdmin: http://localhost:8080" -ForegroundColor White
Write-Host "   • API Documentation: http://localhost:8000/api/status" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default login credentials:" -ForegroundColor Magenta
Write-Host "   • Customer: customer@test.com / password123" -ForegroundColor White
Write-Host "   • Sales Manager: sales@test.com / password123" -ForegroundColor White
Write-Host "   • Staff: staff@test.com / password123" -ForegroundColor White
Write-Host "   • Admin: admin@test.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Database access (phpMyAdmin):" -ForegroundColor Magenta
Write-Host "   • Server: mysql" -ForegroundColor White
Write-Host "   • Username: root" -ForegroundColor White
Write-Host "   • Password: root123" -ForegroundColor White
Write-Host "   • Database: fazzprint_erp" -ForegroundColor White 