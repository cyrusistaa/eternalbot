const fs = require('fs');
const path = require('path');

// Kullanıcıların giriş zamanlarını geçici hafızada tutmak için Map kullanıyoruz
const voiceData = new Map();

module.exports = {
    name: 'voiceStateUpdate', // Discord.js'in ses olaylarını dinleyen event ismi
    async execute(oldState, newState, client) {
        const userId = newState.id;
        const dbPath = path.join(__dirname, '../database.json');

        // --- 1. KULLANICI SESE GİRDİĞİNDE ---
        // Eski kanal yoksa ama yeni kanal varsa kullanıcı yeni girmiştir
        if (!oldState.channelId && newState.channelId) {
            voiceData.set(userId, Date.now());
        }

        // --- 2. KULLANICI SESTEN ÇIKTIĞINDA ---
        // Eski kanal varsa ama yeni kanal yoksa kullanıcı sesten tamamen çıkmıştır
        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceData.get(userId);
            
            if (joinTime) {
                const sessionDuration = Date.now() - joinTime;
                const minutes = Math.floor(sessionDuration / 60000); // Milisaniyeyi dakikaya çevir

                // Sadece en az 1 dakika seste kalmışsa kaydet
                if (minutes > 0) {
                    let db = {};
                    
                    // Veritabanı dosyasını güvenli bir şekilde oku
                    try {
                        if (fs.existsSync(dbPath)) {
                            const fileContent = fs.readFileSync(dbPath, 'utf8');
                            // Dosya varsa ve içi boş değilse parse et, boşsa {} döndür
                            db = fileContent.trim() ? JSON.parse(fileContent) : {};
                        } else {
                            // Dosya yoksa oluştur
                            fs.writeFileSync(dbPath, '{}');
                            db = {};
                        }
                    } catch (err) {
                        console.error("⚠️ Veritabanı okuma hatası (Dosya bozuk olabilir):", err);
                        db = {}; // Hata durumunda boş objeyle devam et ki bot çökmesin
                    }

                    // Kullanıcı verisi veritabanında yoksa ilk halini oluştur
                    if (!db[userId]) {
                        db[userId] = { 
                            username: newState.member?.user?.username || "Bilinmeyen Kullanıcı", 
                            voiceTime: 0, 
                            puan: 0 
                        };
                    }

                    // --- VERİLERİ GÜNCELLE ---
                    // Mevcut sürenin üzerine ekle
                    db[userId].voiceTime = (db[userId].voiceTime || 0) + minutes;
                    
                    // Örnek: Her 5 dakikaya 1 puan ver (İstersen burayı değiştirebilirsin)
                    const kazanilanPuan = Math.floor(minutes / 5);
                    db[userId].puan = (db[userId].puan || 0) + kazanilanPuan;

                    // Kullanıcı adını güncel tut
                    if (newState.member) {
                        db[userId].username = newState.member.user.username;
                    }

                    // --- DOSYAYA KAYDET ---
                    try {
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
                        console.log(`✅ [SES LOG] ${db[userId].username} sesten çıktı. Kazanılan: ${minutes} dk / ${kazanilanPuan} puan.`);
                    } catch (err) {
                        console.error("❌ Veritabanı yazma hatası:", err);
                    }
                }
                // Kullanıcı hafızadan temizle (Tekrar girdiğinde sıfırdan başlasın)
                voiceData.delete(userId);
            }
        }
    }
};
