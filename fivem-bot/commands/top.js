const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Sunucudaki en yüksek puanlı ilk 10 üyeyi listeler.'),

    async execute(interaction) {
        const dbPath = path.join(__dirname, '../database.json');

        try {
            if (!fs.existsSync(dbPath)) {
                return interaction.reply({ content: '❌ Veritabanı dosyası bulunamadı!', ephemeral: true });
            }

            const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            
            // VERİLERİ TEMİZLE VE SIRALA
            const sorted = Object.entries(db)
                .map(([id, data]) => {
                    // Veri objeyse .puan al, değilse direkt sayıyı al
                    const pValue = typeof data === 'object' ? (data.puan || 0) : (data || 0);
                    return { id, puan: pValue };
                })
                .filter(u => u.puan > 0) // Puanı 0 olanları gösterme
                .sort((a, b) => b.puan - a.puan) // Büyükten küçüğe sırala
                .slice(0, 10); // İlk 10 kişi

            if (sorted.length === 0) {
                return interaction.reply({ content: 'ℹ️ Henüz puanı olan bir kullanıcı bulunamadı.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🏆 Eternal Family | Puan Sıralaması')
                .setColor('#f1c40f')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setDescription('Sunucumuzun en aktif üyeleri aşağıda listelenmiştir.')
                .setTimestamp();

            let description = "";
            for (let i = 0; i < sorted.length; i++) {
                const user = sorted[i];
                const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : "🔹"));
                description += `${medal} **${i + 1}.** <@${user.id}> ➔ \`${user.puan} Puan\`\n`;
            }

            embed.setDescription(description);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Top listesi hatası:', error);
            await interaction.reply({ content: '❌ Liste yüklenirken bir hata oluştu.', ephemeral: true });
        }
    }
};
