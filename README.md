# 🐾 HabitPaw

**React Native • Supabase • PostgreSQL • Gemini AI**

HabitPaw, kullanıcıların günlük alışkanlıklarını takip etmelerini, sürdürülebilir rutinler oluşturmalarını ve motivasyonlarını artırmalarını sağlayan yapay zekâ destekli bir mobil alışkanlık takip uygulamasıdır.

Uygulamada bulunan sanal kedi karakteri, kullanıcının günlük alışkanlıklarını tamamlama durumuna göre farklı ruh halleri sergileyerek alışkanlık kazanma sürecini daha eğlenceli ve motive edici hale getirir.

---

# 🌟 Özellikler

## 🤖 Yapay Zekâ Destekli Alışkanlık Önerileri

* Gemini AI ile kişiselleştirilmiş alışkanlık önerileri
* Kullanıcı hedeflerine uygun günlük görevler
* Akıllı öneri sistemi

## 📝 Alışkanlık Yönetimi

* Alışkanlık oluşturma
* Alışkanlık düzenleme ve silme
* Günlük alışkanlık takibi
* Tamamlanan alışkanlıkların görüntülenmesi
* İlerleme takibi

## 🐱 Sanal Kedi Sistemi

* Kullanıcıya eşlik eden sanal kedi
* Tamamlanan alışkanlıklara göre değişen ruh halleri
* Oyunlaştırılmış kullanıcı deneyimi
* Motivasyonu artıran görsel geri bildirimler

## 📊 İstatistikler

* Günlük ilerleme
* Haftalık ve aylık istatistikler
* Tamamlanan alışkanlık oranı
* Seri (Streak) takibi *(Planlanıyor)*

## 👤 Kullanıcı Yönetimi

* Kayıt olma ve giriş yapma
* Kullanıcı profili
* Güvenli kullanıcı yönetimi

---

# 🛠 Kullanılan Teknolojiler

## Frontend

* React Native 0.81
* Expo SDK 54 *(sabitlenmiştir — aşağıdaki nota bakın)*

## Backend

* NestJS
* Prisma ORM
* Supabase (Auth + PostgreSQL)

## Veritabanı

* PostgreSQL

## Yapay Zekâ

* Gemini API

## Geliştirme Araçları

* Git
* GitHub
* Figma
* VS Code

---

# 🚀 Kurulum

## Gereksinimler

* Node.js
* npm
* Expo Go (mağazadaki sürüm — **SDK 54** destekler)
* Supabase projesi
* Gemini API Key

> **Expo SDK sürümü sabittir.** Proje SDK 54'te tutulur, yükseltilmemelidir.
> App Store ve Play Store'daki Expo Go SDK 54'te takılıdır; SDK 55+ için Expo Go
> mağazalarda yoktur ve fiziksel iPhone'da çalıştırmak ücretli Apple Developer
> üyeliği ister. Detaylı gerekçe: `mobile/AGENTS.md`.

## Projeyi Klonlayın

```bash
git clone https://github.com/kullaniciadi/habitpaw.git
cd habitpaw
```

Repo iki uygulamadan oluşur: `mobile/` (Expo) ve `backend/` (NestJS). Her birinin
kendi `package.json` ve `.env` dosyası vardır, ayrı ayrı kurulur ve çalıştırılır.

## Backend'i Kurun ve Başlatın

```bash
cd backend
npm ci
npx prisma generate
```

`.env` dosyasını `backend/.env.example` içeriğine göre doldurun, ardından:

```bash
npm run start:dev
```

Servis `http://localhost:3000/api` adresinde açılır. Swagger arayüzü:
`http://localhost:3000/api/docs`

> `npm ci` sonrası `npx prisma generate` çalıştırmayı atlamayın. Aksi hâlde Prisma
> client şemadan üretilmez ve derleme `HabitFrequency` hatalarıyla patlar.

## Mobil Uygulamayı Kurun ve Başlatın

Ayrı bir terminalde:

```bash
cd mobile
npm install
npx expo start
```

Çıkan QR kodu telefondaki Expo Go ile okutun. Telefon ve bilgisayar aynı Wi-Fi
ağında olmalıdır.

Fiziksel cihazdan test ederken `mobile/.env` içindeki `EXPO_PUBLIC_API_BASE_URL`
değeri `localhost` değil, bilgisayarın **yerel ağ IP adresi** olmalıdır
(örn. `http://192.168.1.175:3000/api`). Windows kullanıyorsanız güvenlik
duvarında `3000` ve `8081` portlarına gelen bağlantılara izin vermeniz gerekir.

| Ortam | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| Fiziksel cihaz + Expo Go | `http://<BILGISAYAR_IP>:3000/api` |
| Android emülatör | `http://10.0.2.2:3000/api` |
| iOS simülatör | `http://localhost:3000/api` |

---

# 📱 Planlanan Ekranlar

* Karşılama
* Giriş Yap
* Kayıt Ol
* Ana Sayfa
* Alışkanlık Ekle
* Alışkanlık Detayı
* Takvim
* İstatistikler
* Sanal Kedi
* Profil
* Ayarlar

---

# 📂 Proje Yapısı

```text
habitpaw/
│
├── mobile/                   # Expo / React Native uygulaması
│   ├── assets/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── theme/
│   ├── App.js
│   └── package.json
│
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── ai/               # Gemini önerileri
│   │   ├── auth/             # Supabase JWT doğrulama
│   │   ├── habits/
│   │   ├── prisma/
│   │   ├── common/
│   │   └── config/
│   ├── docs/
│   └── package.json
│
└── README.md
```

---

# 🔧 Ortam Değişkenleri

İki ayrı `.env` dosyası gerekir. Örnek şablonlar repoda mevcuttur.

## `mobile/.env`

Şablon: `mobile/.env.example`

```env
EXPO_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase publishable / anon key>
EXPO_PUBLIC_API_BASE_URL=http://<BILGISAYAR_IP>:3000/api
```

`EXPO_PUBLIC_*` değişkenleri bundle'a derleme anında gömülür. Değiştirdikten
sonra Metro'yu `npx expo start --clear` ile yeniden başlatın.

Gemini anahtarı mobil tarafta **bulunmaz** — AI çağrıları backend üzerinden yapılır.

## `backend/.env`

Şablon: `backend/.env.example`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=<supabase pooler baglantisi>
DIRECT_URL=<supabase session pooler baglantisi>
SUPABASE_URL=https://<proje-ref>.supabase.co
SUPABASE_JWKS_URL=https://<proje-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_PUBLISHABLE_KEY=<supabase publishable key>
GEMINI_API_KEY=<google ai studio anahtari>
GEMINI_MODEL=<kullanilabilir bir gemini modeli>
```

Mobil ve backend **aynı Supabase projesini** göstermelidir. Farklı projelere
bakarlarsa backend, mobil tarafın ürettiği JWT'yi doğrulayamaz ve tüm korumalı
istekler 401 döner.

---

# 🎯 Projenin Amacı

HabitPaw, kullanıcıların küçük ama düzenli alışkanlıklar kazanmasını eğlenceli hale getirmeyi amaçlamaktadır.

Yapay zekâ destekli öneriler ve sanal kedi sistemi sayesinde kullanıcıların motivasyonunun artırılması ve alışkanlıklarını sürdürülebilir hale getirmesi hedeflenmektedir.

---

# 🚧 Gelecekte Eklenecek Özellikler

* Bildirim Sistemi
* Rozet ve Başarı Sistemi
* Seri (Streak) Takibi
* Karanlık Mod
* Çoklu Dil Desteği
* Ruh Hali Takibi
* AI Yaşam Koçu
* Bulut Senkronizasyonu

---

# 👥 Takım

### Takım Adı

**Mavi**

### Takım Lideri

* Evla Yorulmaz

### Takım Üyeleri

* Evla Yorulmaz
* Semih Biçer
* Beyza

### Mentör

* Alper Sarı

---

# 📄 Lisans

Bu proje eğitim ve geliştirme amacıyla hazırlanmıştır.

---

## 🐾 Küçük alışkanlıklar, büyük değişimler.
