const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'logs',
    execute(client) {
        // --- GİRİŞ LOG ---
        client.on('guildMemberAdd', member => {
            const kanal = client.channels.cache.get(config.GIRIS_CIKIS);
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Aileye Katılım', iconURL: member.user.displayAvatarURL() })
                    .setDescription(`📥 **${member.user.tag}** aramıza katıldı!`)
                    .setColor('#2ecc71')
                    .setTimestamp();
                kanal.send({ embeds: [embed] });
            }
        });

        // --- ÇIKIŞ LOG ---
        client.on('guildMemberRemove', member => {
            const kanal = client.channels.cache.get(config.GIRIS_CIKIS);
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Ayrılma', iconURL: member.user.displayAvatarURL() })
                    .setDescription(`📤 **${member.user.tag}** aramızdan ayrıldı.`)
                    .setColor('#e74c3c')
                    .setTimestamp();
                kanal.send({ embeds: [embed] });
            }
        });

        // --- MESAJ SİLME LOG ---
        client.on('messageDelete', async message => {
            if (message.partial || message.author?.bot) return;
            const kanal = client.channels.cache.get(config.MESAJ_LOG);
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Mesaj Silindi', iconURL: message.author.displayAvatarURL() })
                    .setColor('#f39c12')
                    .addFields(
                        { name: 'Kanal', value: `${message.channel}`, inline: true },
                        { name: 'İçerik', value: `\`\`\`${message.content || "Görsel/Dosya"}\`\`\`` }
                    )
                    .setTimestamp();
                kanal.send({ embeds: [embed] });
            }
        });
    }
};
