# README profile visual

generate.js, profil bilgilerini ve erişilebilir repository/organizasyon/commit metadatasını GitHub API’den alıp public/libs/readme-stats.svg dosyasını üretir. Kod içeriği, dosya ağacı ve diff endpoint’leri kullanılmaz.

Yerelde yalnızca public verilerle çalıştırmak için:

    GITHUB_USERNAME=kilicdev node readme/generate.js

Private repository ve organizasyon adları ile private commit mesajlarını da göstermek için aynı hesabın private kaynaklara erişen token’ını kullan:

    GITHUB_PROFILE_TOKEN=... GITHUB_USERNAME=kilicdev node readme/generate.js

Workflow ayarı:

1. GitHub’da Settings → Secrets and variables → Actions bölümünden GITHUB_PROFILE_TOKEN adlı repository secret oluştur.
2. Token, kilicdev hesabına ait olmalı ve private repository’ler için en az Metadata: Read ile Contents: Read erişimine sahip olmalı.
3. Private organizasyonlar için organizasyon onayı veya gerekli üyelik erişimini ver.
4. Workflow’un GITHUB_TOKEN değeri SVG’yi repository’ye yazmak için, GITHUB_PROFILE_TOKEN ise private profil verisini okumak için kullanılır. Token kaynak koda veya SVG içine yazılmaz.

Fine-grained token ilgili private repository’leri seçemiyorsa private arama için erişimi olan classic token da kullanılabilir. Token yalnızca Actions secret olarak saklanmalı ve public README’ye private proje adları ile commit mesajlarının yazıldığı unutulmamalı.

GitHub Actions çalışma akışı görseli her gün, elle çalıştırıldığında ve readme/ içindeki kod değiştiğinde yeniler. Rate-limit yanıtlarında generator retry header’larını kullanır ve endpoint ile API mesajını log’a ekler.
