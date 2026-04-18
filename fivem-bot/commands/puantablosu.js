const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puantablosu')
        .setDescription('Aile içindeki aktiflik ve puan durumunu gösterir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Profiline bakmak istediğiniz üyeyi seçin.')
                .setRequired(false)), // Boş bırakılırsa kendisini gösterir

    async execute(interaction) {
        // Eğer bir kullanıcı seçilmediyse komutu kullanan kişiyi hedef al
        const target = interaction.options.getUser('kullanici') || interaction.user;
        const dbPath = path.join(__dirname, '../database.json');

        try {
            // Veritabanı dosyası yoksa veya içi boşsa önlem al
            if (!fs.existsSync(dbPath)) {
                return interaction.reply({ content: '❌ Veritabanı henüz oluşturulmamış.', ephemeral: true });
            }

            const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            const userData = db[target.id];

            // Verileri yeni yapıya göre çekelim
            let puan = 0;
            let sesDakika = 0;
            let mesajSayisi = 0;

            if (userData) {
                // Eğer veri bir objeyse içindeki değerleri al
                if (typeof userData === 'object') {
                    puan = userData.puan || 0;
                    sesDakika = userData.voiceTime || 0;
                    mesajSayisi = userData.messageCount || 0; // Varsa mesaj sayın
                } else {
                    // Veri sadece düz sayıysa (eski kalıntı) onu puan kabul et
                    puan = userData || 0;
                }
            }

            // Ses süresini Saat ve Dakika formatına çevirelim
            const saat = Math.floor(sesDakika / 60);
            const dakika = sesDakika % 60;
            const sesFormati = saat > 0 ? `${saat}s ${dakika}dk` : `${dakika}dk`;

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Eternal Family | Üye Profili')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setColor('#34495e') // Eski temandaki Koyu Gri/Mavi renk
                .addFields(
                    { name: '👤 Kullanıcı', value: `${target.tag}`, inline: true },
                    { name: '💰 Mevcut Puan', value: `\`${puan} Puan\``, inline: true },
                    { 
                        name: '📊 İstatistikler', 
                        value: `💬 **${mesajSayisi}** Mesaj\n🔊 **${sesFormati}** Ses`, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Eternal Family Aktiflik Sistemi' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Puan tablosu hatası:', error);
            await interaction.reply({ content: '❌ Veriler okunurken bir hata oluştu.', ephemeral: true });
        }
    }
};
