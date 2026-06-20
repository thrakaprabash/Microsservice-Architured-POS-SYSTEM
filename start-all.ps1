$directories = @(
    "frontend",
    "services\api-gateway",
    "services\auth-service",
    "services\product-service",
    "services\order-service",
    "services\payment-service",
    "services\report-service"
)

Write-Host "Starting POS Microservices..." -ForegroundColor Green

foreach ($dir in $directories) {
    Write-Host "Starting $dir..." -ForegroundColor Cyan
    # Get the absolute path for reliability
    $targetDir = Join-Path -Path $PWD -ChildPath $dir
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$targetDir'; npm run dev"
}

Write-Host "All services are starting up in separate windows!" -ForegroundColor Green
Write-Host "Frontend will be available at http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Gateway will be available at http://localhost:3000" -ForegroundColor Yellow
