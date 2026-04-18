const { EmbedBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.MessageDelete,
    async execute(message, client) {
        if (!message) return;
        if (message.author?.bot) return;

        const guild =
            message.guild ||
            (message.guildId ? await client.guilds.fetch(message.guildId).catch(() => null) : null);
        if (!guild) return;

        const logKanal = guild.channels.cache.get(config.MESAJ_LOG_KANAL_ID);
        if (!logKanal) return;

        const authorTag = message.author?.tag || 'Bilinmiyor';
        const authorId = message.author?.id || message.authorId || 'unknown';
        const channelText = message.channel
            ? `${message.channel}`
            : (message.channelId ? `<#${message.channelId}>` : 'Bilinmiyor');
        const contentText =
            message.content || 'İçerik okunamadı (Mesaj cache\'te değil / resim / embed olabilir)';

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Mesaj Silindi')
            .setColor('#ff0000')
            .addFields(
                { name: 'Gönderen', value: `${authorTag} (${authorId})`, inline: true },
                { name: 'Kanal', value: channelText, inline: true },
                { name: 'İçerik', value: contentText }
            )
            .setTimestamp();

        logKanal.send({ embeds: [embed] }).catch(() => {});
    }
};
