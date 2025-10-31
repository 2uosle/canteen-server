# 🔐 Password Requirements

## Requirements

All passwords in the Smart Canteen System must meet these requirements:

✅ **Minimum 8 characters**
✅ **At least 1 uppercase letter** (A-Z)
✅ **At least 1 special character** (!@#$%^&*(),.?":{}|<>)

---

## ✅ Valid Password Examples

- `Password123!`
- `MyP@ssw0rd`
- `Canteen#2025`
- `SecureP@ss`
- `Admin123!`
- `Student$01`

---

## ❌ Invalid Password Examples

| Password | Why Invalid? |
|----------|-------------|
| `password123` | No uppercase, no special character |
| `Password123` | No special character |
| `password!` | No uppercase |
| `Pass!` | Less than 8 characters |
| `PASSWORD123!` | No lowercase (but still valid) |

---

## 🔧 Allowed Special Characters

You can use any of these special characters:

```
! @ # $ % ^ & * ( ) , . ? " : { } | < >
```

---

## 💡 Tips for Creating Strong Passwords

1. **Use a passphrase:** `Coffee&Donuts2025!`
2. **Mix words with symbols:** `Blue$Sky#Happy`
3. **Replace letters with symbols:** `P@ssw0rd2025!`
4. **Use memorable dates:** `Birthday#1990`

---

## ⚠️ What NOT to Do

❌ Don't use common passwords like `Password123!`
❌ Don't use your name or username
❌ Don't share your password with anyone
❌ Don't write it down in plain text
❌ Don't reuse passwords from other sites

---

## 🎯 Quick Check

Before submitting, verify your password has:
- [ ] At least 8 characters
- [ ] At least 1 uppercase letter (A-Z)
- [ ] At least 1 special character (!@#$%^&*(),.?":{}|<>)

---

## 📝 Error Message

If your password doesn't meet requirements, you'll see:

```
Password must contain at least one uppercase letter 
and one special character (!@#$%^&*(),.?":{}|<>)
```

---

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- Never stored in plain text
- Cannot be recovered (only reset)
- Change regularly for best security

---

**Need help?** Contact system administrator

