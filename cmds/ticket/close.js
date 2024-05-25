const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'close',
    description: 'Ferme le ticket',
    go: async (client, db, config, interaction, args) => {
        try {
            if (!interaction.channel.topic) {
                return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
            }

            const claimedBy = db.get(`ticketClaimedBy_${interaction.channel.id}`);

            if (claimedBy && claimedBy === interaction.user.id) {
                await interaction.channel.delete();
                return;
            }

            if (claimedBy) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('rate_staff')
                            .setPlaceholder('Évaluez le service')
                            .addOptions([
                                { label: '⭐', description: '1 étoile', value: '1' },
                                { label: '⭐⭐', description: '2 étoiles', value: '2' },
                                { label: '⭐⭐⭐', description: '3 étoiles', value: '3' },
                                { label: '⭐⭐⭐⭐', description: '4 étoiles', value: '4' },
                                { label: '⭐⭐⭐⭐⭐', description: '5 étoiles', value: '5' },
                            ]),
                    );

                const embed = new EmbedBuilder()
                    .setTitle('Évaluation du service')
                    .setDescription('Veuillez évaluer le service reçu de 1 à 5 étoiles.')
                    .setColor(0x00ff00);

                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

                const filter = i => i.customId === 'rate_staff' && i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

                collector.on('collect', async i => {
                    const rating = parseInt(i.values[0], 10);
                    const userRatingsKey = `ratings_${claimedBy}`;
                    const totalRatingsKey = `totalRatings_${claimedBy}`;
                    const userRatings = db.get(userRatingsKey) || 0;
                    const totalRatings = db.get(totalRatingsKey) || 0;

                    db.set(userRatingsKey, userRatings + rating);
                    db.set(totalRatingsKey, totalRatings + 1);

                    await i.update({ content: 'Merci pour votre évaluation !', components: [], ephemeral: true });
                    await interaction.channel.delete();
                });

                collector.on('end', async collected => {
                    if (collected.size === 0) {
                        await interaction.editReply({ content: 'Temps écoulé pour l\'évaluation.', components: [], ephemeral: true });
                        await interaction.channel.delete();
                    }
                });

            } else {
                await interaction.channel.delete();
            }
        } catch (error) {
            console.log('Une erreur est survenue lors de l\'exécution de la commande /close :', error);
            interaction.reply({ content: "Une erreur s'est produite lors de la fermeture du ticket.", ephemeral: true });
        }
    },
};
