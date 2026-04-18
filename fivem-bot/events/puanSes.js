const fs = require('fs');
const path = require('path');

// Giriş zamanlarını tutmak için geçici bir hafıza (Bot kapanınca sıfırlanır)
const voiceJoinCache = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const userId = newState.id;
        const dbPath = path.join(__dirname, '../database.json');

        // --- 1. KANALA GİRİŞ ---
        if (!oldState.channelId && newState.channelId) {
            voiceJoinCache.set(userId, Date.now());
        }

        // --- 2. KANALDAN ÇIKIŞ ---
        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceJoinCache.get(userId);
            
            if (joinTime) {
                const durationMs = Date.now() - joinTime;
                const minutes = Math.floor(durationMs / 60000); // Milisaniyeyi dakikaya çevir

                if (minutes > 0) {
                    try {
                        // Veritabanını oku
                        let db = {};
                        if (fs.existsSync(dbPath)) {
                            const data = fs.readFileSync(dbPath, 'utf8');
                            db = data.trim() ? JSON.parse(data) : {};
                        }

                        // Kullanıcı verisi yoksa oluştur
                        if (!db[userId]) {
                            db[userId] = { 
                                username: newState.member?.user?.username || "Bilinmeyen", 
                                puan: 0, 
                                voiceTime: 0, 
                                messageCount: 0,
                                voicePuanBank: 0 // 60 dakikayı tamamlamayan dakikalar burada birikir
                            };
                        }

                        // Toplam seste kalma süresini artır (Tablo için)
                        db[userId].voiceTime = (db[userId].voiceTime || 0) + minutes;
                        
                        // Puan bankasına dakikaları ekle (60 dk = 1 Puan kuralı için)
                        let currentBank = (db[userId].voicePuanBank || 0) + minutes;

                        if (currentBank >= 60) {
                            const earnedPuan = Math.floor(currentBank / 60);
                            const remainder = currentBank % 60;

                            db[userId].puan = (db[userId].puan || 0) + earnedPuan;
                            db[userId].voicePuanBank = remainder; // Artan dakikaları bankada tut
                            
                            console.log(`[PUAN] ${newState.member?.user?.username} seste ${earnedPuan} puan kazandı.`);
                        } else {
                            db[userId].voicePuanBank = currentBank;
                        }

                        // Kullanıcı adını her zaman güncel tut
                        if (newState.member) db[userId].username = newState.member.user.username;

                        // Veritabanını kaydet
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

                    } catch (error) {
                        console.error('Ses puan sistemi hatası:', error);
                    }
                }
                // Hafızadan sil
                voiceJoinCache.delete(userId);
            }
        }
    }
};
