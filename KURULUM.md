# Reef Keeper: kurulum ve işleyiş

reefnetwork.com için sanal resif akvaryumu oyunu. Oyuncular tanklarına 1-2 günde bir bakmak zorunda. Bakmazlarsa balıklar hastalanır ve ölür. Yeni bir tür satın alan oyuncu, o türün ansiklopedi sayfasına yönlendirilir. Sayfayı okursa +50 coin kazanır.

## Kurulum

1. WordPress yönetim paneli → Eklentiler → Yeni ekle → Eklenti yükle → `reef-keeper.zip` → Etkinleştir.
2. Yeni bir sayfa oluştur (önerilen adres: `/reef-keeper/`) ve içine `[reef_keeper]` kısa kodunu ekle. Elementor kullanıyorsan "Shortcode" widget'ı ile ekleyebilirsin.
3. WPML: sayfayı Türkçeye de çevir. Oyun, sayfanın diline göre TR ya da EN açılır.
4. **Ayarlar → Reef Keeper** ekranını kontrol et:
   - **Oyun sayfası URL'si**: 2. adımda oluşturduğun sayfa. E-postalardaki "Tankımı aç" butonu ve ansiklopedideki "Tankına dön" linki buraya gider.
   - **Kayıt ve giriş URL'leri**: Varsayılan değerler sitedeki mevcut "Join" ve `/sign-in/` linkleri.
   - Ekranda "Species found" sayısı görünür. Bu sayı 0 ise kategori slug'ını veya bakım seviyesi meta anahtarını kontrol et.
5. Menüye veya ana sayfaya oyun sayfasının linkini ekle.

## Oyun kuralları (özet)

| | |
|---|---|
| Tanklar | Nano 20L → Küçük 60L → Orta 150L → Resif 300L → Uzman 500L |
| Türler | Nano: Kolay balıklar. Küçük: + Orta seviye. Orta: + mercan ve omurgasızlar. Resif: + Zor. Uzman: + Sadece uzman. |
| Bakım | Besle (6 saatte bir), su testi (12 saat), cam silme (8 saat), su değişimi (20 saat). Her biri coin ve XP verir. |
| Bozulma | 1. gün acıkma başlar. 2. gün su kirlenir ve yosun çıkar. 3. gün hayvanlar hastalanır ve e-posta gider. 5. gün en zayıf hayvan ölür. |
| Acil durum | Bir ölümden sonra 24 saat başka ölüm olmaz. Oyuncu bu sürede besler ve suyu değiştirirse tank kurtulur. |
| Pasif gelir | Sağlıklı hayvanlar coin biriktirir. Birikim üst sınırda durur, toplamak için oyuncunun gelmesi gerekir. |
| Üyelik | Misafirler Nano tankta oynar ve ilerlemeleri tarayıcıda saklanır. Büyük tanklar, e-posta hatırlatmaları ve her cihazdan erişim üyelik ister. Kayıt olan misafirin tankı hesabına taşınır. |
| Ansiklopedi ödülü | Yeni tür alınınca bir Keşif Kartı açılır. Oyuncu tür sayfasında 20 saniye kalırsa ya da sayfanın yarısını okursa +50 coin kazanır. Ödül her tür için bir kez verilir. |

## Teknik notlar

- Türler WooCommerce ürünlerinden okunur: `saltwater-aquarium-encyclopedia` kategorisi ve `livestock_care_level` meta alanı. Siteye eklenen yeni türler oyuna otomatik gelir (önbellek 12 saat, ürün kaydedilince temizlenir). Bugünkü 33 türün çizimi ansiklopedi fotoğraflarına bakılarak elle ayarlandı (gövde biçimi, yüzgeçler, şerit ve benekler). Yeni türler isimden üretilen bir görünüm alır. Görünümler `assets/looks.js` dosyasında, ürün slug’ına göre tutulur. `demo/gallery.html` her türün fotoğrafını ve çizimini yan yana gösterir.
- Üye verisi `reef_keeper_state` user meta'sında tutulur. Simülasyon sunucuda çalışır, coin ve cooldown'lar sunucuda doğrulanır.
- E-postalar saatlik WP-Cron ile gider. Her üyeye günde en fazla 1 e-posta gönderilir ve her e-postada abonelikten çıkma linki vardır. Sitede trafik azsa WP-Cron gecikebilir. Gerçek bir sunucu cron'u kurmak önerilir (`wp cron event run --due-now`).
- Oyun metinleri `assets/i18n.js` dosyasında, e-posta metinleri `includes/class-mailer.php` dosyasında.

## Yerel demo ve testler

- `demo/index.html` dosyası WordPress olmadan oyunu çalıştırır. Test panelindeki butonlarla zamanı ileri saracak, üyelik açıp kapatacak ve dil değiştirebilirsin. Klasörü bir yerel sunucu ile aç: `python3 -m http.server -d reef-keeper` ve ardından `http://localhost:8000/demo/`.
- Kural testleri:
  - `node --test tests/*.test.js`: JS motoru.
  - `php tests/engine-test.php`: PHP motorunun JS ile aynı sonuçları verdiğini doğrular.
