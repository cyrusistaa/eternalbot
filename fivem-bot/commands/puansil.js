const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puansil')
        .setDescription('Belirtilen kullanıcıdan puan siler.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Puanı silinecek kullanıcıyı seçin.')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Silinecek puan miktarını girin.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');
        const dbPath = path.join(__dirname, '../database.json');

        if (miktar <= 0) {
            return interaction.reply({ content: '❌ Silinecek miktar 0\'dan büyük olmalıdır!', ephemeral: true });
        }

        try {
            if (!fs.existsSync(dbPath)) {
                return interaction.reply({ content: '❌ Veritabanı dosyası bulunamadı!', ephemeral: true });
            }

            let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

            // KULLANICI KONTROLÜ VE PUAN ÇEKME
            if (!db[user.id]) {
                return interaction.reply({ content: `❌ **${user.username}** isimli kullanıcının sistemde hiç verisi yok.`, ephemeral: true });
            }

            // Veri yapısını analiz et (Obje mi yoksa direkt sayı mı?)
            let mevcutPuan = 0;
            if (typeof db[user.id] === 'object') {
                mevcutPuan = db[user.id].puan || 0;
            } else {
                mevcutPuan = db[user.id] || 0;
            }

            if (mevcutPuan <= 0) {
                return interaction.reply({ content: `❌ **${user.username}** isimli kullanıcının zaten puanı yok.`, ephemeral: true });
            }

            // PUAN DÜŞÜRME İŞLEMİ
            let yeniPuan = mevcutPuan - miktar;
            if (yeniPuan < 0) yeniPuan = 0;

            // VERİYİ KAYDETME (Mevcut yapıyı bozmadan güncelle)
            if (typeof db[user.id] === 'object') {
                db[user.id].puan = yeniPuan;
            } else {
                db[user.id] = yeniPuan;
            }

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

            const embed = new EmbedBuilder()
                .setTitle('📉 Puan Silindi')
                .setColor('#e74c3c')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Kullanıcı', value: `${user}`, inline: true },
                    { name: '➖ Silinen', value: `\`${miktar}\``, inline: true },
                    { name: '💰 Kalan Puan', value: `\`${yeniPuan}\``, inline: true }
                )
                .setFooter({ text: `${interaction.user.tag} tarafından işlem yapıldı.` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Puan silme hatası:', error);
            await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', ephemeral: true });
        }
    }
};
