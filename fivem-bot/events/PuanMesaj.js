const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Botları ve DM'leri engelle
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const dbPath = path.join(__dirname, '../database.json');

        try {
            // 1. Veritabanını Oku
            let db = {};
            if (fs.existsSync(dbPath)) {
                const data = fs.readFileSync(dbPath, 'utf8');
                db = data.trim() ? JSON.parse(data) : {};
            }

            // 2. Kullanıcı Verisi Yoksa Oluştur
            if (!db[userId]) {
                db[userId] = { 
                    username: message.author.username, 
                    puan: 0, 
                    voiceTime: 0, 
                    messageCount: 0,
                    msgCounter: 0 // Puan için sayaç
                };
            }

            // 3. Mesaj Sayılarını Artır
            db[userId].messageCount = (db[userId].messageCount || 0) + 1;
            db[userId].msgCounter = (db[userId].msgCounter || 0) + 1;
            db[userId].username = message.author.username; // Kullanıcı adını güncel tut

            // 4. Puan Kontrolü (Her 10 mesajda 1 puan)
            if (db[userId].msgCounter >= 10) {
                db[userId].puan = (db[userId].puan || 0) + 1; // 1 Puan ekle
                db[userId].msgCounter = 0; // Sayacı sıfırla
                console.log(`[PUAN] ${message.author.username} 10 mesajı geçti, 1 puan kazandı.`);
            }

            // 5. Veritabanını Kaydet
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        } catch (error) {
            console.error('Mesaj puan sistemi hatası:', error);
        }
    }
};
