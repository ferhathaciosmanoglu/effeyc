/**
 * Uygulama verileri — "Uygulamalarım" klasörleri bu diziden oluşturulur.
 * Yeni uygulama eklemek = diziye tek obje eklemek (görselleri public/apps/<id>/ altına koy).
 * Boş kategoriler klasör olarak gösterilmez.
 */
export const categories = ["Üretkenlik", "İş", "Finans", "Sağlık", "Eğitim", "Günlük Yaşam"] as const;
export type Category = (typeof categories)[number];

/** public/ altındaki bir dosyanın (alt dizine yayında da çalışan) adresi */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export type AppItem = {
  id: string;
  name: string;
  category: Category;
  icon: string; // lucide-react ikon adı (src/components/sections/app-icons.ts)
  description: string;
  details: string[];
  tech: string[];
  /** Uygulamanın amacı: hangi ihtiyaca çözüm olarak yapıldı */
  purpose: string;
  /** Nasıl bir yaklaşımla geliştirildi */
  approach: string;
  /** Canlı uygulama adresi; "#" ise henüz yok */
  url: string;
  /** public/apps/<id>/ altındaki ekran görüntüleri; "cover" klasör kapağı olarak kullanılır */
  images: { src: string; alt: string }[];
  cover: string;
};

const shots = (id: string, alts: string[]) => alts.map((alt, i) => ({ src: asset(`apps/${id}/${i + 1}.webp`), alt }));
const cover = (id: string) => asset(`apps/${id}/cover.webp`);

// [YER TUTUCU] canlı linkleri (url) kendi yayın adreslerinle değiştir.
export const apps: AppItem[] = [
  {
    id: "proje-takip", name: "ENORPA Proje Takip", category: "İş", icon: "ClipboardList",
    description: "Kazan projelerini satıştan devreye almaya kadar adım adım takip eder; takvim, bakım ve göstergelerle ekibi tek panelde buluşturur.",
    details: ["Rol çarklı giriş ve yetkiye göre ekran", "Aşama aşama proje ilerlemesi", "Takvim, bakım planı ve bildirimler", "Resmi form çıktıları ve Excel/CSV dışa aktarma"],
    tech: ["Vite", "JavaScript", "PWA", "IndexedDB"], 
    purpose: "Kazan projelerinin satıştan devreye almaya uzanan sürecini tek yerden, kimin sırasında olduğunu görerek yönetmek.",
    approach: "Her aşamayı sorumlu ekibe atayan, ilerlemeyi panelde gösteren; takvim, bakım planı ve resmi form çıktılarını içeren, çevrimdışı da kullanılabilen bir PWA olarak geliştirdim.",
    url: "#", cover: cover("proje-takip"),
    images: shots("proje-takip", ["Proje listesi ve özet kartları", "Proje ilerleme paneli ve detay", "Rol seçimi giriş ekranı"]),
  },
  {
    id: "is-formlari", name: "ENORPA İş Formları", category: "İş", icon: "FileText",
    description: "Servis formu oluşturma, firma kartları, bakım takibi ve raporları tek uygulamada toplar; mobilde sahada rahatça kullanılır.",
    details: ["Servis formu ve firma kartları", "Yaklaşan ve geciken bakım takibi", "Arama, filtre ve raporlar", "Çevrimdışı çalışabilen PWA"],
    tech: ["Vite", "JavaScript", "Firebase", "PWA"], 
    purpose: "Servis formlarını, firma kartlarını ve periyodik bakım takibini kâğıt ve dağınık dosyalardan çıkarıp tek uygulamada toplamak.",
    approach: "Mobil öncelikli, çevrimdışı çalışabilen bir PWA: Firebase ile bulut senkronizasyonu, firma ve tarih bazlı arama, yaklaşan ve geciken bakım uyarıları, raporlar.",
    url: "#", cover: cover("is-formlari"),
    images: shots("is-formlari", ["Ana panel ve yaklaşan bakımlar", "Son eklenen kayıtlar akışı", "Form arama ve filtreler", "Masaüstü görünümü"]),
  },
  {
    id: "saha-raporu", name: "Saha Ziyareti Raporu", category: "İş", icon: "FileText",
    description: "Sahada bilgileri girin, fotoğrafları seçin; yöneticiye hazır, markalı bir PDF rapor oluşturun ve paylaşın.",
    details: ["3 adımlı akış: ziyaret kartı, fotoğraflar, rapor", "Rapor önizleme ve PDF olarak kaydetme", "Taslak otomatik saklanır", "E-posta ve paylaşım desteği"],
    tech: ["Next.js", "TypeScript", "PWA"], 
    purpose: "Saha ziyaretinden sonra raporu hızlıca ve standart bir biçimde hazırlayıp yöneticiye iletmek.",
    approach: "Üç adımlı bir akış (ziyaret kartı, fotoğraflar, rapor): markalı raporu önizletir, PDF'e çevirir; cihazın paylaşım menüsüyle ya da e-postayla gönderir.",
    url: "#", cover: cover("saha-raporu"),
    images: shots("saha-raporu", ["Rapor ve gönderme adımı", "Rapor önizleme", "Mobil ana ekran"]),
  },
  {
    id: "brulor-kontrol", name: "Brülör Kontrol", category: "İş", icon: "ClipboardList",
    description: "Brülör kontrolünde marka, seri ve model seçimi; fotoğraf, ölçü verileri ve PDF raporu tek uygulamada.",
    details: ["Marka, seri ve model seçimi", "Katalog verileriyle otomatik doldurma", "10 adımlı fotoğraflı kontrol", "Dijital arşiv ve seri numarasıyla arama"],
    tech: ["JavaScript", "Firebase", "PWA"], 
    purpose: "Brülör kurulum ve kontrol sürecini standartlaştırmak; fotoğraflı kaydı ve PDF raporu tek akışta üretmek.",
    approach: "Marka, seri ve model seçimini katalog verisine bağlar; 10 adımlı fotoğraflı kontrol akışıyla ilerler, sonuçları PDF rapora ve dijital arşive aktarır.",
    url: "#", cover: cover("brulor-kontrol"),
    images: shots("brulor-kontrol", ["Ana ekran", "Model seçimi", "Fotoğraf ve manuel giriş adımı"]),
  },
  {
    id: "harcama-formu", name: "Harcama Formu", category: "Finans", icon: "Wallet",
    description: "Proje bazlı harcama fişlerini toplar, günlere ve kategorilere göre gruplar, hazır şablonda Excel çıktısı verir.",
    details: ["Proje bazlı çalışma ve özet kartları", "Kategori ve ödeme türü seçimi", "Günlük toplamlar", "Verileri telefonda saklayan, sunucusuz PWA"],
    tech: ["JavaScript", "PWA", "IndexedDB"], 
    purpose: "Seyahat ve proje harcamalarını fişlerden alıp şirketin hazır harcama formuna aktarma işini hızlandırmak.",
    approach: "Proje bazlı çalışır; fişleri gün ve kategoriye göre gruplar, hazır Excel şablonunda çıktı verir. Kendi sunucusu yoktur, veriler telefonda saklanır.",
    url: "#", cover: cover("harcama-formu"),
    images: shots("harcama-formu", ["Proje listesi ve toplamlar", "Proje ve fiş listesi"]),
  },
  {
    id: "ferconvert", name: "FERCONVERT", category: "Üretkenlik", icon: "FileText",
    description: "Tarayıcıda yerel çalışan PDF ve dosya araçları: birleştir, böl, sıkıştır, dönüştür ve düzenle. Dosyalar sunucuya yüklenmez.",
    details: ["PDF birleştirme, bölme ve sıkıştırma", "PDF Studio ile sayfa düzenleme", "Görsel ve veri dönüştürücüler", "Gizlilik odaklı, tamamen tarayıcıda"],
    tech: ["JavaScript", "PDF.js", "pdf-lib", "PWA"], 
    purpose: "PDF ve dosya işlemlerini, dosyaları bir sunucuya yüklemeden, gizliliği koruyarak yapmak.",
    approach: "Tüm işlemleri tarayıcıda çalıştıran bir araç takımı: birleştirme, bölme, sıkıştırma, dönüştürme ve PDF Studio ile düzenleme. Mobilde de kullanılabilen bir PWA.",
    url: "#", cover: cover("ferconvert"),
    images: shots("ferconvert", ["Çalışma alanı", "Araç paneli", "PDF Studio editörü", "Mobil görünüm"]),
  },
  {
    id: "zihin-alani", name: "Zihin Alanı", category: "Üretkenlik", icon: "CalendarCheck",
    description: "Görevlerinizi kategorilere ayırın, tarih ve saat verin, ilerlemenizi halka grafikte izleyin.",
    details: ["İş, ev ve kişisel kategoriler", "Arama ve tarih/saat seçici", "İlerleme halkası", "Açık ve koyu tema"],
    tech: ["JavaScript", "HTML", "CSS"], 
    purpose: "Günlük görevleri sade bir ekranda toplayıp ilerlemeyi görünür kılmak.",
    approach: "Kategori, öncelik ve tarih/saat seçimi, arama ve ilerleme halkası; açık ve koyu temalı, hafif bir web uygulaması.",
    url: "#", cover: cover("zihin-alani"),
    images: shots("zihin-alani", ["Açık tema", "Koyu tema"]),
  },
  {
    id: "ferness", name: "FERNESS", category: "Sağlık", icon: "HeartPulse",
    description: "Antrenman programı oluşturun, hazır şablonları uygulayın, setleri işaretleyin ve ilerlemenizi takip edin.",
    details: ["Haftalık program ve hareket kütüphanesi", "Hazır program şablonları", "Kalori ve BMI hesaplama", "Ölçüm ve kas haritası"],
    tech: ["JavaScript", "Firebase"], 
    purpose: "Antrenman programını planlayıp uygulamak ve ilerlemeyi tek yerde takip etmek.",
    approach: "Haftalık program oluşturucu, hazır şablonlar, hareket kütüphanesi, set takibi, ölçümler ve kalori/BMI hesaplayıcı; veriler Firebase ile bulutta senkronize edilir.",
    url: "#", cover: cover("ferness"),
    images: shots("ferness", ["Haftalık program", "Hazır programlar", "Kalori hesaplama", "Mobil görünüm"]),
  },
  {
    id: "ferkey", name: "FerKey", category: "Günlük Yaşam", icon: "Bot",
    description: "Güvenli, hızlı birebir mesajlaşma uygulaması. Gerçek zamanlı sohbet, medya paylaşımı ve üyelik tabanlı erişim kuralları.",
    details: ["Gerçek zamanlı mesajlaşma", "Özel medya depolama", "Üyelik tabanlı güvenli erişim", "PWA olarak kurulabilir"],
    tech: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS"], 
    purpose: "Güvenli, hızlı ve sade bir birebir mesajlaşma deneyimi sunmak.",
    approach: "Next.js ve TypeScript ile geliştirilen bir PWA: kimlik doğrulama ve veriler Supabase'te, erişim üyelik bazlı kurallarla korunur; mesajlar, tepkiler ve okundu bilgisi gerçek zamanlıdır.",
    url: "#", cover: cover("ferkey"),
    images: shots("ferkey", ["Giriş ekranı", "Mobil giriş", "Kayıt ekranı"]),
  },
  {
    id: "kartvizit", name: "Dijital Kartvizit", category: "Günlük Yaşam", icon: "Bot",
    description: "Modern, mobil uyumlu dijital kartvizit: tek dokunuşla paylaşım, QR kod ve açık/koyu tema. Demo içeriktir.",
    details: ["QR kod ile paylaşım", "Hızlı işlem düğmeleri", "Açık ve koyu tema", "Bağlantı kartları"],
    tech: ["HTML", "CSS", "JavaScript"], 
    purpose: "Kartvizit paylaşımını kâğıttan dijitale taşıyıp tek dokunuşla ulaşılabilir hâle getirmek.",
    approach: "Telefonda hızlı açılan; QR kod, hızlı işlem düğmeleri ve bağlantı kartları sunan, açık/koyu temalı bir arayüz. Gösterilen sürüm kişisel bilgi içermeyen bir demodur.",
    url: asset("demos/kartvizit/"), cover: cover("kartvizit"),
    images: shots("kartvizit", ["Koyu tema", "Açık tema", "QR ile paylaşım"]),
  },
];
