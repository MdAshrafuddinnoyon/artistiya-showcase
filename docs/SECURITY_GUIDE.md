# নিরাপত্তা গাইড | Security Guide

এই ডকুমেন্টে অ্যাপ্লিকেশনের সিকিউরিটি আর্কিটেকচার এবং বেস্ট প্র্যাকটিস বর্ণনা করা হয়েছে।

---

## 🔐 নিরাপত্তা স্তর

### ১. Database Security (RLS)

সমস্ত সংবেদনশীল টেবিলে Row Level Security (RLS) সক্রিয়:

| টেবিল | নিরাপত্তা স্তর | বিবরণ |
|-------|---------------|-------|
| `payment_providers` | 🔴 Admin Only | পেমেন্ট ক্রেডেনশিয়াল |
| `email_settings` | 🔴 Admin Only | SMTP/API কী |
| `delivery_providers` | 🔴 Admin Only | ডেলিভারি API কী |
| `site_integrations` | 🔴 Admin Only | থার্ড-পার্টি ইন্টিগ্রেশন |
| `customers` | 🟡 Admin + Self | গ্রাহক তথ্য |
| `orders` | 🟡 Admin + Owner | অর্ডার তথ্য |
| `products` | 🟢 Public Read | পণ্য তথ্য |

### ২. Credential Encryption

সংবেদনশীল ক্রেডেনশিয়াল `pgp_sym_encrypt` দিয়ে এনক্রিপ্ট করা:

```sql
-- এনক্রিপশন (Edge Function থেকে)
UPDATE payment_providers 
SET api_key = encrypt_credential_value('secret', key)
WHERE id = 'xxx';

-- ডিক্রিপশন
SELECT decrypt_credential(api_key, key) FROM payment_providers;
```

### ৩. Authentication

- Supabase Auth ব্যবহার করা হয়
- Email verification প্রয়োজন
- Math CAPTCHA লগইন/সাইনআপে সক্রিয়

---

## 🛡️ নিরাপত্তা চেকলিস্ট

### ✅ সম্পন্ন

- [x] RLS সকল সংবেদনশীল টেবিলে সক্রিয়
- [x] Admin role validation (`is_admin()` function)
- [x] Credential encryption at rest
- [x] XSS prevention (DOMPurify sanitization)
- [x] Edge function error masking
- [x] Fraud detection system
- [x] Blocked customer management

### ⚠️ ম্যানুয়াল অ্যাকশন প্রয়োজন

- [ ] **Leaked Password Protection** সক্রিয় করুন:
  1. Supabase Dashboard → Authentication → Providers
  2. "Leaked Password Protection" Enable করুন

---

## 🔧 Admin Role Management

### Admin যোগ করা

```sql
-- user_roles টেবিলে admin যোগ করুন
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

### Admin চেক

```sql
-- is_admin function ব্যবহার
SELECT public.is_admin('user-uuid');
```

---

## 🚨 Emergency Actions

### সন্দেহজনক অ্যাক্টিভিটি

```sql
-- ইউজার ব্লক করুন
INSERT INTO blocked_customers (user_id, block_reason, blocked_by)
VALUES ('user-id', 'Suspicious activity', 'admin-id');

-- সকল সেশন রিভোক
-- Supabase Dashboard → Authentication → Users → সিলেক্ট করে "Revoke Sessions"
```

### Data Breach Response

1. সমস্ত API keys রোটেট করুন
2. `CREDENTIALS_ENCRYPTION_KEY` পরিবর্তন করুন
3. Re-encrypt সকল credentials
4. ইউজারদের পাসওয়ার্ড রিসেট করতে বলুন

---

## 📊 Security Monitoring

### লগ চেক

```sql
-- সাম্প্রতিক ফ্রড ফ্ল্যাগ
SELECT * FROM order_fraud_flags ORDER BY created_at DESC LIMIT 20;

-- ব্লক করা গ্রাহক
SELECT * FROM blocked_customers WHERE is_active = true;
```

### মেট্রিক্স

- দৈনিক ফ্রড ফ্ল্যাগ সংখ্যা
- ব্যর্থ লগইন প্রচেষ্টা
- API rate limit hits

---

## 🔄 Regular Maintenance

### সাপ্তাহিক

- Fraud logs পর্যালোচনা
- ব্লক করা গ্রাহক তালিকা যাচাই

### মাসিক

- Credential rotation (API keys)
- RLS policy audit
- Access log review

### ত্রৈমাসিক

- Full security audit
- Penetration testing (প্রস্তাবিত)
- Backup restore test
