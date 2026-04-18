const config = require('../config.json');

module.exports = {
    name: 'ready',
    async execute(client) {
        console.log(`âœ… ${client.user.tag} paneli izlemeye baÅŸladÄ±!`);

        const guildId = process.env.GUILD_ID || config.GUILD_ID;
        let firstRun = true;

        const getChannel = async (guild, channelId) => {
            if (!channelId) return null;
            const cached = guild.channels?.cache?.get(channelId) || client.channels.cache.get(channelId);
            if (cached) return cached;
            return await client.channels.fetch(channelId).catch(() => null);
        };

        const panelGuncelle = async () => {
            const guild = (guildId && client.guilds.cache.get(guildId)) || client.guilds.cache.first();
            if (!guild) return;

            if (firstRun) {
                console.log(`🧩 [STATS] Tick başladı. Guild: ${guild.name} (${guild.id})`);
                console.log(`🧩 [STATS] Kanal ID'leri: TARIKH=${config.KANAL_TARIKH} AKTIF=${config.KANAL_AKTIF} TOPLAM=${config.KANAL_TOPLAM}`);
            }

            // --- 1. TARÄ°H KANALI GÃœNCELLEME (TÃ¼rkiye Saati ile) ---
            try {
                const tarihKanal = await getChannel(guild, config.KANAL_TARIKH);
                if (firstRun && !tarihKanal) console.log(`âš ï¸ Tarih kanalÄ± bulunamadÄ±. ID: ${config.KANAL_TARIKH}`);
                if (tarihKanal) {
                    const simdi = new Date();
                    const trTarih = new Intl.DateTimeFormat('tr-TR', {
                        timeZone: 'Europe/Istanbul',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).format(simdi);

                    const yeniIsim = `ğŸ“… Tarih: ${trTarih}`;
                    if (tarihKanal.name !== yeniIsim) {
                        await tarihKanal.setName(yeniIsim)
                            .then(() => console.log(`ğŸ“… Tarih GÃ¼ncellendi: ${trTarih}`))
                            .catch(err => console.log(`âš ï¸ Tarih gÃ¼ncellenemedi: ${err?.code || ''} ${err?.message || err}`));
                    } else if (firstRun) {
                        console.log(`🧩 [STATS] Tarih zaten güncel: ${yeniIsim}`);
                    }
                }
            } catch (err) {
                console.error("âŒ Tarih Panel HatasÄ±:", err?.message || err);
            }

            // --- 2/3. AKTÄ°F + TOPLAM SAYIMLAR (Ã¼ye fetch gerekebilir) ---
            let membersFetched = false;
            try {
                await guild.members.fetch({ withPresences: true });
                membersFetched = true;
            } catch (err) {
                console.log(`âš ï¸ Ãœyeler Ã§ekilemedi: ${err?.message || err}`);
            }

            if (!membersFetched) return;

            try {
                const aktifKanal = await getChannel(guild, config.KANAL_AKTIF);
                if (firstRun && !aktifKanal) console.log(`âš ï¸ Aktif kanalÄ± bulunamadÄ±. ID: ${config.KANAL_AKTIF}`);
                if (aktifKanal) {
                    const aktifSayisi = guild.members.cache.filter(m => m.presence && (m.presence.status !== 'offline' && m.presence.status !== 'invisible')).size;
                    const yeniIsim = `ğŸŸ¢ Aktif: ${aktifSayisi}`;

                    if (aktifKanal.name !== yeniIsim) {
                        await aktifKanal.setName(yeniIsim).catch(() => {});
                    }
                }

                const toplamKanal = await getChannel(guild, config.KANAL_TOPLAM);
                if (firstRun && !toplamKanal) console.log(`âš ï¸ Toplam kanalÄ± bulunamadÄ±. ID: ${config.KANAL_TOPLAM}`);
                if (toplamKanal) {
                    const aileUyeSayisi = guild.members.cache.filter(m => m.roles.cache.has(config.AILE_ROL_ID)).size;
                    const yeniIsim = `âš”ï¸ Toplam: ${aileUyeSayisi}`;

                    if (toplamKanal.name !== yeniIsim) {
                        await toplamKanal.setName(yeniIsim).catch(() => {});
                    }
                }
            } catch (err) {
                console.error("âŒ Panel HatasÄ±:", err?.message || err);
            }

            firstRun = false;
        };

        // ilk tick hemen dene, sonra 10sn sonra bir daha, sonra 5dk'da bir
        panelGuncelle().catch(() => {});
        setTimeout(panelGuncelle, 10000);
        setInterval(panelGuncelle, 300000);
    }
};
