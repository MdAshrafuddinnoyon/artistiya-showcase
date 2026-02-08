# ডাটাবেস মাইগ্রেশন গাইড | Database Migration Guide

এই গাইডটি আপনার অ্যাপ্লিকেশনের ডাটাবেস অন্য প্ল্যাটফর্মে (যেমন: Hostinger, DigitalOcean, AWS RDS, Railway) মাইগ্রেট করার জন্য।

---

## 📋 সূচিপত্র

1. [প্রয়োজনীয়তা](#প্রয়োজনীয়তা)
2. [বর্তমান Supabase থেকে এক্সপোর্ট](#বর্তমান-supabase-থেকে-এক্সপোর্ট)
3. [নতুন ডাটাবেসে ইম্পোর্ট](#নতুন-ডাটাবেসে-ইম্পোর্ট)
4. [Hostinger-এ মাইগ্রেশন](#hostinger-এ-মাইগ্রেশন)
5. [অ্যাপ্লিকেশন কনফিগারেশন আপডেট](#অ্যাপ্লিকেশন-কনফিগারেশন-আপডেট)
6. [নিরাপত্তা বিবেচনা](#নিরাপত্তা-বিবেচনা)

---

## প্রয়োজনীয়তা

- PostgreSQL 14+ (প্রোডাকশনের জন্য প্রস্তাবিত)
- `pg_dump` এবং `psql` CLI টুলস
- নতুন হোস্টের ডাটাবেস ক্রেডেনশিয়াল
- SSL সার্টিফিকেট (প্রোডাকশনের জন্য প্রয়োজনীয়)

---

## বর্তমান Supabase থেকে এক্সপোর্ট

### ধাপ ১: স্কিমা এক্সপোর্ট

```bash
# Supabase CLI দিয়ে স্কিমা এক্সপোর্ট
supabase db dump --schema public --file schema.sql

# অথবা pg_dump ব্যবহার করে
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f schema_export.sql
```

### ধাপ ২: ডাটা এক্সপোর্ট

```bash
# সম্পূর্ণ ডাটা এক্সপোর্ট
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  -f data_export.sql

# নির্দিষ্ট টেবিল এক্সপোর্ট (ঐচ্ছিক)
pg_dump "postgresql://..." \
  --table=products \
  --table=categories \
  --table=orders \
  -f selected_tables.sql
```

### ধাপ ৩: Storage ফাইল এক্সপোর্ট

```bash
# Supabase Storage থেকে ফাইল ডাউনলোড
# product-images, media, testimonials, custom-designs buckets

# স্ক্রিপ্ট ব্যবহার করে:
node scripts/export-storage.js
```

---

## নতুন ডাটাবেসে ইম্পোর্ট

### ধাপ ১: ডাটাবেস তৈরি

```sql
-- নতুন ডাটাবেস তৈরি
CREATE DATABASE artisan_shop;

-- প্রয়োজনীয় extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### ধাপ ২: স্কিমা ইম্পোর্ট

```bash
psql -h [HOST] -U [USER] -d artisan_shop -f schema_export.sql
```

### ধাপ ৩: ডাটা ইম্পোর্ট

```bash
psql -h [HOST] -U [USER] -d artisan_shop -f data_export.sql
```

---

## Hostinger-এ মাইগ্রেশন

### Hostinger MySQL ব্যবহার করলে

⚠️ **সতর্কতা**: এই অ্যাপ্লিকেশন PostgreSQL-এর জন্য ডিজাইন করা। MySQL-এ মাইগ্রেট করতে হলে:

1. **স্কিমা রূপান্তর প্রয়োজন**
   - `uuid` → `CHAR(36)` বা `BINARY(16)`
   - `jsonb` → `JSON`
   - `text[]` → আলাদা টেবিল
   - PostgreSQL-specific functions রিরাইট

2. **প্রস্তাবিত বিকল্প**: Hostinger VPS নিন এবং PostgreSQL ইনস্টল করুন

### Hostinger VPS-এ PostgreSQL

```bash
# 1. SSH দিয়ে কানেক্ট
ssh root@your-vps-ip

# 2. PostgreSQL ইনস্টল
apt update
apt install postgresql postgresql-contrib

# 3. ডাটাবেস সেটআপ
sudo -u postgres createuser --interactive
sudo -u postgres createdb artisan_shop

# 4. Remote access enable
nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = '*'

nano /etc/postgresql/14/main/pg_hba.conf
# host all all 0.0.0.0/0 md5

# 5. রিস্টার্ট
systemctl restart postgresql

# 6. ফায়ারওয়াল
ufw allow 5432/tcp
```

---

## অ্যাপ্লিকেশন কনফিগারেশন আপডেট

### ১. Environment Variables

```env
# .env ফাইল আপডেট করুন

# Supabase থেকে সরাসরি PostgreSQL-এ সুইচ করতে:
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/artisan_shop

# অথবা নতুন Supabase প্রজেক্টে পয়েন্ট করুন:
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
```

### ২. কোড পরিবর্তন (যদি Supabase ছাড়া PostgreSQL ব্যবহার করেন)

```typescript
// src/lib/db.ts - নতুন ফাইল তৈরি করুন
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Query helper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

### ৩. Edge Functions মাইগ্রেশন

Edge functions Deno-তে লেখা। সেগুলো:
- **Supabase Edge Functions** - যেমন আছে রাখুন
- **অন্য হোস্ট** - Node.js/Express API-এ কনভার্ট করুন

```javascript
// Express.js উদাহরণ
const express = require('express');
const app = express();

app.post('/api/send-order-email', async (req, res) => {
  // Edge function লজিক এখানে
});
```

---

## নিরাপত্তা বিবেচনা

### ১. RLS (Row Level Security)

Supabase-এর বাইরে RLS কাজ করবে না। বিকল্প:

```typescript
// Application-level authorization
async function getOrders(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await query('SELECT * FROM orders');
  }
  return await query('SELECT * FROM orders WHERE user_id = $1', [userId]);
}
```

### ২. Credential Encryption

বর্তমান এনক্রিপশন সিস্টেম:
- `CREDENTIALS_ENCRYPTION_KEY` secret ব্যবহার হয়
- Payment, delivery, email credentials encrypted

নতুন হোস্টে:
```bash
# নতুন encryption key জেনারেট
openssl rand -base64 32

# Environment variable হিসেবে সেট করুন
export CREDENTIALS_ENCRYPTION_KEY="your-new-key"
```

### ৩. SSL/TLS

```bash
# Let's Encrypt SSL (VPS-এর জন্য)
apt install certbot
certbot certonly --standalone -d your-domain.com
```

---

## চেকলিস্ট

- [ ] স্কিমা এক্সপোর্ট সম্পন্ন
- [ ] ডাটা এক্সপোর্ট সম্পন্ন
- [ ] Storage ফাইল ব্যাকআপ
- [ ] নতুন ডাটাবেস তৈরি
- [ ] Extensions ইনস্টল
- [ ] স্কিমা ইম্পোর্ট
- [ ] ডাটা ইম্পোর্ট
- [ ] Environment variables আপডেট
- [ ] SSL কনফিগার
- [ ] Application-level security ইমপ্লিমেন্ট
- [ ] Edge functions কনভার্ট (যদি প্রয়োজন)
- [ ] Storage সলিউশন সেটআপ
- [ ] টেস্টিং সম্পন্ন
- [ ] DNS আপডেট

---

## সহায়তা

সমস্যা হলে:
1. PostgreSQL logs চেক করুন
2. Connection string যাচাই করুন
3. Firewall rules পরীক্ষা করুন
4. SSL certificates যাচাই করুন
