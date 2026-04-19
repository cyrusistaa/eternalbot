const { get: getSetting } = require('../lib/settings');

const EMOJI_DATE = '\uD83D\uDCC5'; // 📅
const EMOJI_ACTIVE = '\uD83D\uDFE2'; // 🟢
const EMOJI_TOTAL = '\u2694\uFE0F'; // ⚔️

module.exports = {
    name: 'ready',
    async execute(client) {
        console.log(`âœ… ${client.user.tag} paneli izlemeye baÅŸladÄ±!`);

        const guildId = getSetting('GUILD_ID');
        let firstRun = true;

        const getChannel = async (guild, channelId) => {
            if (!channelId) return null;
            const cached = guild.channels?.cache?.get(channelId) || client.channels.cache.get(channelId);
            if (cached) return cached;
            return await client.channels.fetch(channelId).catch(() => null);
        };

        const panelGuncelle = async () => {
            const guild =
                (guildId && client.guilds.cache.get(guildId)) ||
                (guildId ? await client.guilds.fetch(guildId).catch(() => null) : null) ||
                client.guilds.cache.first();
            if (!guild) return;

            if (firstRun) {
                console.log(`🧩 [STATS] Tick başladı. Guild: ${guild.name} (${guild.id})`);
                console.log(`🧩 [STATS] Kanal ID'leri: TARIKH=${getSetting('KANAL_TARIKH')} AKTIF=${getSetting('KANAL_AKTIF')} TOPLAM=${getSetting('KANAL_TOPLAM')}`);
            }

            // --- 1. TARÄ°H KANALI GÃœNCELLEME (TÃ¼rkiye Saati ile) ---
            try {
                const tarihKanalId = getSetting('KANAL_TARIKH');
                const tarihKanal = await getChannel(guild, tarihKanalId);
                if (firstRun && !tarihKanal) console.log(`⚠️ Tarih kanalı bulunamadı. ID: ${tarihKanalId}`);
                if (tarihKanal) {
                    const simdi = new Date();
                    const trTarih = new Intl.DateTimeFormat('tr-TR', {
                        timeZone: 'Europe/Istanbul',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).format(simdi);

                    const yeniIsim = `${EMOJI_DATE} Tarih: ${trTarih}`;
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
                const aktifKanalId = getSetting('KANAL_AKTIF');
                const aktifKanal = await getChannel(guild, aktifKanalId);
                if (firstRun && !aktifKanal) console.log(`⚠️ Aktif kanalı bulunamadı. ID: ${aktifKanalId}`);
                if (aktifKanal) {
                    const aktifSayisi = guild.members.cache.filter(m => !m.user.bot && m.presence && (m.presence.status !== 'offline' && m.presence.status !== 'invisible')).size;
                    const yeniIsim = `${EMOJI_ACTIVE} Aktif: ${aktifSayisi}`;

                    if (aktifKanal.name !== yeniIsim) {
                        await aktifKanal.setName(yeniIsim).catch(() => {});
                    }
                }

                const toplamKanalId = getSetting('KANAL_TOPLAM');
                const toplamKanal = await getChannel(guild, toplamKanalId);
                if (firstRun && !toplamKanal) console.log(`⚠️ Toplam kanalı bulunamadı. ID: ${toplamKanalId}`);
                if (toplamKanal) {
                    const toplamUye = guild.memberCount;
                    const yeniIsim = `${EMOJI_TOTAL} Toplam: ${toplamUye}`;

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
