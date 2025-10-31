# Environment Validation Script
# Checks if .env is properly configured

Write-Host "🔍 Environment Configuration Validator" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create one by running:" -ForegroundColor Yellow
    Write-Host "  .\setup-env.ps1" -ForegroundColor White
    Write-Host "Or manually:" -ForegroundColor Yellow
    Write-Host "  copy env.template .env" -ForegroundColor White
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Load .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

Write-Host "📋 Checking required variables..." -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# Required variables
$required = @{
    'PORT' = 'Server port number'
    'NODE_ENV' = 'Environment mode (development/production)'
    'DB_HOST' = 'Database host'
    'DB_USER' = 'Database username'
    'DB_PASS' = 'Database password'
    'DB_NAME' = 'Database name'
    'JWT_SECRET' = 'JWT secret key'
}

foreach ($var in $required.Keys) {
    if ($envVars.ContainsKey($var) -and -not [string]::IsNullOrWhiteSpace($envVars[$var])) {
        Write-Host "  ✅ $var" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $var - MISSING!" -ForegroundColor Red
        Write-Host "     ($($required[$var]))" -ForegroundColor Gray
        $errors++
    }
}

Write-Host ""
Write-Host "🔐 Security checks..." -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan

# Check JWT_SECRET strength
if ($envVars.ContainsKey('JWT_SECRET')) {
    $jwtSecret = $envVars['JWT_SECRET']
    
    if ($jwtSecret.Length -lt 32) {
        Write-Host "  ⚠️  JWT_SECRET is too short (< 32 characters)" -ForegroundColor Yellow
        Write-Host "     Recommended: 64+ characters" -ForegroundColor Gray
        $warnings++
    } elseif ($jwtSecret.Length -lt 64) {
        Write-Host "  ⚠️  JWT_SECRET could be stronger (< 64 characters)" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "  ✅ JWT_SECRET length OK ($($jwtSecret.Length) chars)" -ForegroundColor Green
    }
    
    # Check for common weak secrets
    $weakSecrets = @(
        'your_super_secret_jwt_key',
        'change_this',
        'secret',
        'password',
        '12345',
        'canteen_secret_key',
        'please_change_this_secret_key_in_production'
    )
    
    if ($weakSecrets -contains $jwtSecret) {
        Write-Host "  ❌ JWT_SECRET is using a default/weak value!" -ForegroundColor Red
        Write-Host "     Generate a strong one: node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor Gray
        $errors++
    }
}

# Check DB_PASS
if ($envVars.ContainsKey('DB_PASS')) {
    $dbPass = $envVars['DB_PASS']
    
    if ($dbPass -match 'your_.*_password|change_this|password123') {
        Write-Host "  ⚠️  DB_PASS appears to be a placeholder" -ForegroundColor Yellow
        Write-Host "     Make sure to use your actual MySQL password" -ForegroundColor Gray
        $warnings++
    } elseif ($dbPass.Length -lt 8) {
        Write-Host "  ⚠️  DB_PASS is weak (< 8 characters)" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "  ✅ DB_PASS configured" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "⚙️  Configuration checks..." -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Cyan

# Check NODE_ENV
if ($envVars.ContainsKey('NODE_ENV')) {
    $nodeEnv = $envVars['NODE_ENV']
    
    if ($nodeEnv -eq 'production') {
        Write-Host "  🔒 Production mode enabled" -ForegroundColor Yellow
        
        # Extra checks for production
        if ($envVars['CORS_ORIGIN'] -eq '*') {
            Write-Host "     ⚠️  CORS_ORIGIN is set to * in production!" -ForegroundColor Red
            Write-Host "        Set to specific domain(s) for security" -ForegroundColor Gray
            $warnings++
        }
        
        if (-not $envVars.ContainsKey('TRUST_PROXY') -or $envVars['TRUST_PROXY'] -eq 'false') {
            Write-Host "     ⚠️  TRUST_PROXY is false - OK if not behind proxy" -ForegroundColor Yellow
        }
        
    } elseif ($nodeEnv -eq 'development') {
        Write-Host "  ✅ Development mode" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  NODE_ENV has unexpected value: $nodeEnv" -ForegroundColor Yellow
        Write-Host "     Should be 'development' or 'production'" -ForegroundColor Gray
        $warnings++
    }
}

# Check PORT
if ($envVars.ContainsKey('PORT')) {
    $port = $envVars['PORT']
    
    if ($port -match '^\d+$') {
        Write-Host "  ✅ PORT is numeric: $port" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PORT is not a valid number: $port" -ForegroundColor Red
        $errors++
    }
}

# Check Redis
if ($envVars.ContainsKey('REDIS_ENABLED') -and $envVars['REDIS_ENABLED'] -eq 'true') {
    Write-Host "  ℹ️  Redis is enabled" -ForegroundColor Cyan
    if (-not $envVars.ContainsKey('REDIS_URL')) {
        Write-Host "     ⚠️  REDIS_URL not configured" -ForegroundColor Yellow
        $warnings++
    }
}

# Check WebSocket
if ($envVars.ContainsKey('WS_ENABLED') -and $envVars['WS_ENABLED'] -eq 'true') {
    Write-Host "  ℹ️  WebSocket is enabled" -ForegroundColor Cyan
    if (-not $envVars.ContainsKey('WS_PORT')) {
        Write-Host "     ⚠️  WS_PORT not configured" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📊 VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan
Write-Host "Errors:   $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($errors -gt 0) {
    Write-Host "❌ Configuration has errors - please fix before starting server" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Run setup wizard: .\setup-env.ps1" -ForegroundColor Yellow
    Write-Host "💡 Or edit manually: notepad .env" -ForegroundColor Yellow
    exit 1
} elseif ($warnings -gt 0) {
    Write-Host "⚠️  Configuration has warnings - server will work but check recommendations" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📚 Read ENV-SETUP.md for best practices" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "✅ Configuration is valid!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to start server: node server.js" -ForegroundColor Cyan
    exit 0
}

