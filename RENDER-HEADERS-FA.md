# راهنمای انتشار و تنظیمات Render — رادمهر گروپ

## نوع سرویس و مسیر انتشار
- نوع سرویس: **Static Site**
- Build Command: خالی (این پروژه HTML/CSS/JavaScript خالص است و build step ندارد)
- Publish Directory: `.` (ریشه repository؛ همان‌جایی که `index.html`، پوشه‌های `css/`، `js/`، `images/` و `font/` قرار دارند)
- شاخه متصل‌شده: شاخه‌ای که خودتان در GitHub برای انتشار انتخاب می‌کنید. تا زمان تأیید نسخه آزمایشی، شاخه اصلی فعلی سایت را تغییر ندهید.

Render برای Static Site فایل‌ها را روی CDN سراسری ارائه می‌کند و HTTP/2، Brotli و ابطال کش CDN پس از Deploy را پشتیبانی می‌کند. با این حال، سرعت واقعی به شبکه بازدیدکننده، اندازه منابع، اولویت بارگذاری و پاسخ سرویس‌های ثالث نیز وابسته است.

## مسیر اصلی و آدرس‌های قدیمی
صفحه اصلی واقعی اکنون در ریشه پروژه (`/index.html`) است؛ فایل قدیمی `html/index.html` که صفحه بدون ایندکس/انتقال‌دهنده بود حذف شده است. در Dashboard سرویس Render به Settings → Redirects/Rewrites بروید و این قوانین را به‌صورت **Redirect (301)** اضافه کنید:

| Source | Destination | Action |
|---|---|---|
| `/html/index.html` | `/` | Redirect (301) |
| `/html` | `/` | Redirect (301) |
| `/html/` | `/` | Redirect (301) |

از قانون عمومی `/html/*` استفاده نکنید؛ صفحه‌های واقعی `about.html`، `services.html`، `projects.html`، `contact.html` و صفحه‌های پروژه داخل `/html/` هستند و باید همچنان قابل دسترسی بمانند. Render قوانین Redirect/Rewrite را برای مسیری که فایل واقعی در همان مسیر دارد اعمال نمی‌کند؛ به همین علت فایل قدیمی `html/index.html` عمداً در این نسخه وجود ندارد.

## هدرهای امنیتی
در Dashboard → Settings → Headers این موارد را اضافه کنید:

| Path | Header | Value |
|---|---|---|
| `/*` | `X-Content-Type-Options` | `nosniff` |
| `/*` | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `/*` | `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `/*` | `X-Frame-Options` | `DENY` |

این سایت در iframe نمایش داده نمی‌شود؛ اگر بعداً قرار شد در دامنه/سامانه دیگری embed شود، مقدار X-Frame-Options را متناسب با آن تصمیم بازبینی کنید.

## Cache-Control پیشنهادی
نام فایل‌ها hash-versioned نیستند؛ بنابراین از `immutable` یا cache یک‌ساله استفاده نکنید. این قانون‌ها را تنظیم کنید:

| Path | Header | Value |
|---|---|---|
| `/*.html` | `Cache-Control` | `no-cache, max-age=0, must-revalidate` |
| `/**/*.html` | `Cache-Control` | `no-cache, max-age=0, must-revalidate` |
| `/css/*` | `Cache-Control` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/js/*` | `Cache-Control` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/images/*` | `Cache-Control` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/font/*` | `Cache-Control` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/robots.txt` | `Cache-Control` | `public, max-age=3600` |
| `/sitemap.xml` | `Cache-Control` | `public, max-age=3600` |

در Render نسخه منتشرشده با Deploy موفق، کش CDN را invalidate می‌کند؛ ولی مرورگر بازدیدکننده ممکن است فایل‌های cache‌شده قبلی را تا پایان عمرشان نگه دارد. برای پروژه بعدی بهتر است نام فایل‌های CSS/JS و تصاویر مهم را با hash یا version تغییر دهید تا امکان cache طولانی و امن‌تر فراهم شود.

## Content Security Policy (CSP)
فعلاً CSP را فعال نکنید. این پروژه یک اسکریپت کوچک inline برای اعمال تم پیش از نمایش CSS دارد و فرم تماس نیز با `fetch` به `https://api.web3forms.com` متصل می‌شود. CSP اشتباه ممکن است همین دو مورد یا ارسال فرم را مسدود کند.

اگر بعداً خواستید CSP را فعال کنید، ابتدا آن را با `Content-Security-Policy-Report-Only` در مرورگر آزمایش کنید. hash اسکریپت inline تم در همین نسخه:

```text
sha256-szqEHJxc2bGEH7ORVAIOq+3L7CsbjWog8HwzegWQ634=
```

این hash فقط برای همان متن دقیق اسکریپت inline معتبر است؛ با هر تغییر در آن، hash باید دوباره محاسبه شود. `connect-src` و `form-action` باید دامنه Web3Forms را مجاز کنند. پس از بررسی Console و Network، سیاست نهایی را محدود و فعال کنید.

## فرم تماس و Web3Forms
- Access Key موجود در HTML طبق مستندات رسمی Web3Forms یک شناسه عمومی است، نه رمز خصوصی؛ پنهان‌سازی آن در frontend ممکن نیست و خود سرویس آن را public می‌داند.
- چون هر دارنده کلید می‌تواند تلاش کند پیام بفرستد، مقصد ایمیل را در داشبورد خود بررسی کنید و CAPTCHA/Turnstile یا domain restriction را فعال کنید، اگر در طرح شما در دسترس است. Domain restriction طبق مستندات Web3Forms قابلیت Pro است.
- ارسال فرم واقعی در این محیط انجام/تأیید نشده است. پس از Deploy، با اطلاعات آزمایشی خودتان فرم را ارسال و دریافت ایمیل و هدایت به `thank-you.html` را تأیید کنید. فرم را با داده شخصی واقعی آزمایش نکنید.
- مستندات رسمی Web3Forms درباره نگهداری داده‌ها در FAQ و Privacy Policy فعلی یکسان نیست؛ صفحه Privacy Policy مورخ ۱۳ ژوئیه ۲۰۲۶ تا حداکثر سه سال نگهداری را ذکر می‌کند، در حالی که FAQ می‌گوید ارسال‌ها را ذخیره نمی‌کند. متن حریم خصوصی سایت عمداً این ناسازگاری را آشکار می‌کند و تضمین قطعی نمی‌دهد.

## SEO و دامنه
در این نسخه canonical، Open Graph، JSON-LD، `robots.txt` و `sitemap.xml` به دامنه فعلی زیر اشاره دارند:

`https://radmehr-group-demo.onrender.com/`

پس از اتصال دامنه اختصاصی، باید URL مطلق همه صفحات در canonical، `og:url`، `og:image`، JSON-LD، `robots.txt` و `sitemap.xml` به دامنه نهایی تغییر کند؛ سپس sitemap در Google Search Console ثبت شود. صفحه‌های `privacy.html` و `thank-you.html` و `404.html` عمداً noindex و خارج از sitemap هستند.

## 404 و تست مسیرهای آنلاین
فایل `404.html` در ریشه انتشار قرار دارد. پس از Deploy، یک آدرس تصادفی ناموجود (مثلاً `/this-page-should-not-exist`) را باز کنید و در Network بررسی کنید که صفحه سفارشی نمایش داده شود و status واقعی پاسخ همچنان **404** باشد. فقط نمایش یک صفحه با متن 404 کافی نیست؛ اگر پاسخ status=200 باشد، باید routing/404 در سرویس بررسی شود.

## آزمون پس از Deploy
1. صفحه اصلی `/` و مسیرهای قدیمی `/html/` و `/html/index.html` را باز کنید.
2. در DevTools → Network فیلتر `Img` را انتخاب کنید؛ تمام تصاویر مهم باید 200 و Content-Type صحیح `image/webp` یا `image/svg+xml` داشته باشند.
3. صفحه خدمات را با fragment قدیمی مانند `/html/services.html#facade` باز کنید؛ کارت «طراحی نما» باید باز شود.
4. صفحه تماس را باز کنید؛ تصویر پس‌زمینه، Estedad، منو و تم روشن/تیره را بررسی کنید.
5. با گوشی در عرض‌های 360px و 390px، منو، کارت‌ها، فرم، گالری و فوتر را بررسی کنید.
6. ارسال واقعی Web3Forms و دریافت ایمیل را با درخواست آزمایشی تأیید کنید.
7. PageSpeed Insights را برای URL موبایل و دسکتاپ اجرا کنید؛ نتیجه را با نسخه قبلی در شرایط مشابه مقایسه کنید.

## منابع رسمی
- Render Static Sites: https://render.com/docs/static-sites
- Render Redirects and Rewrites: https://render.com/docs/redirects-rewrites
- Render Static Site Headers: https://render.com/docs/static-site-headers
- Web3Forms FAQ: https://docs.web3forms.com/getting-started/faq
- Web3Forms Privacy Policy: https://web3forms.com/privacy
- PageSpeed Insights: https://pagespeed.web.dev/
