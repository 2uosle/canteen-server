# Encoding Fix - Quick Reference

## Quick Fix
```powershell
cd c:\MyProj\canteen-server
powershell -ExecutionPolicy Bypass -File .\fix-encoding.ps1
```

## What It Fixes
- ❌ `?50.00` → ✅ `₱50.00` (Philippine Peso)
- ❌ `�` symbols → ✅ Proper Unicode characters
- ❌ Smart quotes broken → ✅ " " displaying correctly

## Files Fixed (14 total)
- 2 HTML files
- 6 CSS files
- 6 JavaScript files

## Verification
```powershell
# Check if any encoding errors remain
cd c:\MyProj\canteen-server
$files = Get-ChildItem -Path ".\public" -Recurse -Include *.html,*.css,*.js
foreach($file in $files) {
    $content = Get-Content -Raw -Encoding UTF8 $file.FullName
    if($content -match '�') {
        Write-Host "Error in: $($file.Name)" -ForegroundColor Red
    }
}
Write-Host "Check complete!" -ForegroundColor Green
```

## Prevent Future Issues

### VS Code
1. Open Settings (Ctrl+,)
2. Search: `files.encoding`
3. Set to: `utf8bom`

### When Creating New Files
- Always save as UTF-8 with BOM
- Use the fix script after adding new files
- Check for `?` or `�` characters before committing

## Common Characters Now Fixed
- ₱ - Philippine Peso
- © - Copyright
- ™ - Trademark
- " " - Smart quotes
- — - Em dash
- – - En dash
- … - Ellipsis
- × - Multiplication
- ÷ - Division

## Troubleshooting

**Question marks still appearing?**
```powershell
# Re-run the fix
.\fix-encoding.ps1
```

**Script won't run?**
```powershell
# Use full path
powershell -ExecutionPolicy Bypass -File "C:\MyProj\canteen-server\fix-encoding.ps1"
```

**New file has encoding issues?**
1. Add file path to `fix-encoding.ps1` at line 9-22
2. Re-run script

## Technical Details
- **Encoding:** UTF-8 with BOM (Byte Order Mark)
- **BOM Bytes:** EF BB BF
- **Line Endings:** CRLF (Windows style)
- **Safe to re-run:** Yes, anytime

## Files
- `fix-encoding.ps1` - The fix script
- `ENCODING-FIX-SUMMARY.md` - Detailed documentation
- `.gitattributes` - Git encoding config

---

**Status:** ✅ All 14 files successfully fixed  
**Last Run:** November 10, 2025  
**Result:** 0 errors, all encoding issues resolved
