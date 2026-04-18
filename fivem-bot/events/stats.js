const config = require('../config.json');

module.exports = {
    name: 'ready',
    async execute(client) {
        console.log(`✅ ${client.user.tag} paneli izlemeye başladı!`);

        async function panelGuncelle() {
            const guild = client.guilds.cache.get(config.SUNUCU_ID) || client.guilds.cache.first();
            if (!guild) return;

            try {
                // Üye bilgilerini çekelim (Aktiflik ve rol sayımı için şart)
                await guild.members.fetch({ withPresences: true });

                // --- 1. TARİH KANALI GÜNCELLEME (Türkiye Saati ile) ---
                const tarihKanal = guild.channels.cache.get(config.KANAL_TARIKH);
                if (tarihKanal) {
                    // Türkiye saati (GMT+3) için ayar
                    const simdi = new Date();
                    const trTarih = new Intl.DateTimeFormat('tr-TR', {
                        timeZone: 'Europe/Istanbul',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).format(simdi);

                    const yeniIsim = `📅 Tarih: ${trTarih}`;
                    
                    if (tarihKanal.name !== yeniIsim) {
                        await tarihKanal.setName(yeniIsim)
                            .then(() => console.log(`📅 Tarih Güncellendi: ${trTarih}`))
                            .catch(err => console.log("⚠️ Tarih güncellenemedi (Hız sınırı olabilir)"));
                    }
                }

                // --- 2. AKTİF ÜYE KANALI ---
                const aktifKanal = guild.channels.cache.get(config.KANAL_AKTIF);
                if (aktifKanal) {
                    const aktifSayisi = guild.members.cache.filter(m => m.presence && (m.presence.status !== 'offline' && m.presence.status !== 'invisible')).size;
                    const yeniIsim = `🟢 Aktif: ${aktifSayisi}`;
                    
                    if (aktifKanal.name !== yeniIsim) {
                        await aktifKanal.setName(yeniIsim).catch(() => {});
                    }
                }

                // --- 3. TOPLAM ÜYE KANALI ---
                const toplamKanal = guild.channels.cache.get(config.KANAL_TOPLAM);
                if (toplamKanal) {
                    const aileUyeSayisi = guild.members.cache.filter(m => m.roles.cache.has(config.AILE_ROL_ID)).size;
                    const yeniIsim = `⚔️ Toplam: ${aileUyeSayisi}`;
                    
                    if (toplamKanal.name !== yeniIsim) {
                        await toplamKanal.setName(yeniIsim).catch(() => {});
                    }
                }

            } catch (err) {
                console.error("❌ Panel Hatası:", err.message);
            }
        }

        // Aktif kullanıcı ve tarih için 5 dakikalık periyot
        setInterval(panelGuncelle, 300000); 
        
        // İlk çalıştırma (10 saniye sonra)
        setTimeout(panelGuncelle, 10000);
    }
};
