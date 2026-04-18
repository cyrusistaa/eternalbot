const { EmbedBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.MessageDelete, // Mesaj silindiğinde çalışır
    async execute(message, client) {
        if (message.author?.bot || !message.guild) return;

        const logKanal = message.guild.channels.cache.get(config.MESAJ_LOG_KANAL_ID);
        if (!logKanal) return;

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Mesaj Silindi')
            .setColor('#ff0000')
            .addFields(
                { name: 'Gönderen', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Kanal', value: `${message.channel}`, inline: true },
                { name: 'İçerik', value: message.content || 'İçerik okunamadı (Resim veya Embed olabilir)' }
            )
            .setTimestamp();

        logKanal.send({ embeds: [embed] }).catch(() => {});
    }
};
