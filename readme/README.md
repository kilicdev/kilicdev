# README profile visual

generate.js GitHub API'den profil, güncellenen public repolar, organizasyonlar ve son commit'leri alıp public/libs/readme-stats.svg dosyasını üretir.

Yerelde çalıştırmak için:

    GITHUB_USERNAME=kilicdev node readme/generate.js

GitHub Actions çalışma akışı bunu her gün, elle çalıştırıldığında ve readme/ içindeki kod değiştiğinde yeniler. API limiti için workflow GITHUB_TOKEN kullanır; kullanıcı adı GITHUB_USERNAME ile değiştirilebilir.
