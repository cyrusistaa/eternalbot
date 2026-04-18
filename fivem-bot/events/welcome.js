const { EmbedBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.GuildMemberAdd, 
    async execute(member) {
        // Botları koruma sistemi (antiBot) zaten hallettiği için burada işlem yapmıyoruz
        if (member.user.bot) return;

        const logKanalId = config.GIRIS_CIKIS;
        const logKanal = member.guild.channels.cache.get(logKanalId);

        try {
            // --- 1. SADECE TEMEL ROLÜ VERME (OTO_ROL) ---
            // AILE_ROL_ID'yi buradan kaldırdık ki adam kayıt olmadan o yetkiyi almasın.
            const otoRolId = config.OTO_ROL_ID;
            
            if (otoRolId && otoRolId.length > 5) {
                await member.roles.add(otoRolId).catch(err => 
                    console.log(`[HATA] Oto-rol verilemedi:`, err.message)
                );
            }

            // --- 2. LOG VE HOŞ GELDİN MESAJLARI ---
            if (logKanal) {
                // A) YETKİLİLERE ÖZEL BİLDİRİM (Etiketsiz/Ever'sız)
                const basvuruEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Yeni bir üye katıldı!', iconURL: member.guild.iconURL() })
                    .setTitle('⚔️ Aileye Yeni Katılım')
                    .addFields(
                        { name: 'Kullanıcı', value: `${member} (${member.user.username})`, inline: true },
                        { name: 'Hesap ID', value: `\`${member.id}\``, inline: true }
                    )
                    .setColor('#f1c40f')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter({ text: `Katılım Saati: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` });

                // Burada content kısmından @everyone'ı sildim.
                await logKanal.send({ embeds: [basvuruEmbed] });

                // B) GENEL HOŞ GELDİN MESAJI
                const hgEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Hoş Geldin!', iconURL: member.user.displayAvatarURL() })
                    .setDescription(`👋 **${member.user.username}** sunucumuza katıldı.\n\n> Aramıza hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişi olduk.`)
                    .setColor('#2ecc71')
                    .setTimestamp();

                await logKanal.send({ embeds: [hgEmbed] });
            }

            // --- 3. KULLANICIYA ÖZEL DM MESAJI ---
            try {
                await member.send(`Merhaba **${member.user.username}**, **Eternal Family** sunucusuna hoş geldin! Kayıt olmak için yetkililerimizi bekleyebilirsin. 🛡️`);
            } catch (e) {
                // DM kapalıysa hata vermesin
            }

        } catch (error) {
            console.error('Welcome sistemi hatası:', error);
        }
    }
};
