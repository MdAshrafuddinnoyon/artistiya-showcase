# Mobile Layout Guide

## Overview

এই অ্যাপ্লিকেশনে মোবাইল এবং ডেস্কটপ উভয় ডিভাইসের জন্য সম্পূর্ণ আলাদা লেআউট ব্যবহার করা হয়েছে। সমস্ত কন্টেন্ট ডাটাবেস থেকে ডায়নামিক্যালি আসে এবং Admin Panel থেকে নিয়ন্ত্রণ করা যায়।

## Mobile Layout Architecture

### Key Components

1. **MobileHomeLayout** (`src/components/home/MobileHomeLayout.tsx`)
   - মোবাইল হোমপেজের মূল কন্টেইনার
   - শুধুমাত্র মোবাইল ডিভাইসে রেন্ডার হয় (`md:hidden`)
   - HeroSlider এবং DynamicSections রেন্ডার করে

2. **MobileDynamicSections** (`src/components/home/MobileDynamicSections.tsx`)
   - সমস্ত হোমপেজ সেকশন ডাটাবেস থেকে রেন্ডার করে
   - `homepage_sections` টেবিলের `display_order` অনুযায়ী সাজানো
   - প্রতিটি section_type এর জন্য মোবাইল-অপ্টিমাইজড UI

3. **DynamicHomepageSections** (`src/components/home/DynamicHomepageSections.tsx`)
   - শুধুমাত্র ডেস্কটপে রেন্ডার হয়
   - মোবাইলে স্বয়ংক্রিয়ভাবে স্কিপ করে

## Database Tables

### homepage_sections
সমস্ত হোমপেজ সেকশনের কনফিগারেশন সংরক্ষণ করে:

| Column | Description |
|--------|-------------|
| `id` | Unique identifier |
| `section_type` | সেকশনের ধরন (categories, products, testimonials, etc.) |
| `title` | সেকশনের শিরোনাম |
| `subtitle` | সাবটাইটেল (optional) |
| `display_order` | প্রদর্শন ক্রম (0 থেকে শুরু) |
| `is_active` | সক্রিয় কিনা |
| `config` | অতিরিক্ত কনফিগারেশন (JSON) |

### Supported Section Types

| Type | Description | Config Options |
|------|-------------|----------------|
| `categories` | ক্যাটাগরি স্লাইডার | - |
| `new_arrivals` | নতুন পণ্য স্লাইডার | `limit` |
| `featured_static` | ফিচার্ড প্রোডাক্ট | `limit` |
| `best_selling` | বেস্ট সেলার | `limit`, `show_badge` |
| `products` | নির্দিষ্ট প্রোডাক্ট | `product_ids` |
| `category` | ক্যাটাগরি প্রোডাক্ট | `category_id`, `limit` |
| `discount` | ডিসকাউন্ট প্রোডাক্ট | `min_discount`, `limit` |
| `banner` | ব্যানার ইমেজ | `image_url`, `link`, `button_text` |
| `testimonials` | কাস্টমার রিভিউ | - |
| `youtube` | ইউটিউব ভিডিও | `limit` |
| `blog` | ব্লগ পোস্ট | `limit`, `show_excerpt` |
| `faq` | প্রশ্নোত্তর | `limit`, `page_type` |
| `featured` | ফিচার্ড কালেকশন | `collection_key`, `collection_id` |
| `making` | Behind the Craft | - |

## Section Ordering

Admin Panel থেকে সেকশনগুলো উপরে-নিচে করতে:

1. Admin Panel > Homepage Sections এ যান
2. প্রতিটি সেকশনের drag handle ধরে টানুন
3. অথবা display_order নম্বর পরিবর্তন করুন
4. পরিবর্তন স্বয়ংক্রিয়ভাবে সেভ হবে

## Multi-Language Support

প্রতিটি সেকশনে বাংলা এবং ইংরেজি উভয় ভাষা সাপোর্ট করে:

```typescript
// Example usage in components
const { language } = useLanguage();

// Display based on language
{language === "bn" && product.name_bn ? product.name_bn : product.name}
```

### Translation Fields

| Table | Bengali Field |
|-------|---------------|
| `products` | `name_bn` |
| `categories` | `name_bn` |
| `blog_posts` | `title_bn`, `excerpt_bn`, `content_bn` |
| `faq_items` | `question_bn`, `answer_bn` |
| `youtube_videos` | `title_bn` |
| `testimonials` | - (currently English only) |

## Real-time Updates

সমস্ত সেকশন Supabase Realtime ব্যবহার করে। Admin Panel-এ করা পরিবর্তন সাথে সাথে ফ্রন্ট-এন্ডে প্রতিফলিত হয়:

```typescript
const channel = supabase
  .channel('mobile_homepage_sections')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_sections' }, fetchData)
  .subscribe();
```

## Mobile-Specific Optimizations

1. **Horizontal Sliders**: প্রোডাক্ট, ক্যাটাগরি, ব্লগ সবকিছুতে সোয়াইপ-ফ্রেন্ডলি স্লাইডার
2. **Compact Cards**: মোবাইলে ছোট কার্ড সাইজ
3. **Touch Gestures**: টাচ সোয়াইপ সাপোর্ট
4. **Reduced Data**: মোবাইলে কম আইটেম লোড
5. **Optimized Images**: মোবাইল-স্পেসিফিক ইমেজ URL সাপোর্ট

## Adding New Sections

নতুন সেকশন যোগ করতে:

1. `homepage_sections` টেবিলে নতুন রো যোগ করুন
2. `section_type` নির্ধারণ করুন
3. প্রয়োজনীয় `config` সেট করুন
4. `display_order` দিয়ে পজিশন ঠিক করুন
5. `is_active: true` করুন

## Troubleshooting

### সেকশন প্রদর্শিত হচ্ছে না
1. `is_active` চেক করুন
2. প্রয়োজনীয় data আছে কিনা দেখুন (যেমন products, categories)
3. Console errors চেক করুন

### ডুপ্লিকেট সেকশন
- MobileHomeLayout এবং DynamicHomepageSections আলাদা এবং একে অপরকে ওভাররাইড করে না

### স্লো লোডিং
- প্রোডাক্ট লিমিট কমান
- ইমেজ অপ্টিমাইজ করুন
