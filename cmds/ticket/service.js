const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'service',
    description: 'Affiche le nombre de tickets réclamés et la moyenne des évaluations d\'un utilisateur',
    options: [
        {
            name: 'utilisateur',
            type: 'USER',
            description: 'L\'utilisateur dont vous souhaitez connaître les statistiques de service',
            required: true
        }
    ],
    go: async (client, db, config, interaction, args) => {
        try {
            const user = interaction.options.getUser('utilisateur');
            const ticketsClaimed = db.get(`ticketsClaimed_${user.id}`) || 0;
            const userRatingsKey = `ratings_${user.id}`;
            const totalRatingsKey = `totalRatings_${user.id}`;
            const totalRatings = db.get(totalRatingsKey) || 0;
            const userRatings = db.get(userRatingsKey) || 0;
            const averageRating = totalRatings > 0 ? ((userRatings / totalRatings) * 20).toFixed(2) : 0;

            const embed = new EmbedBuilder()
                .setTitle(`Statistiques de service pour ${user.tag}`)
                .addFields(
                    { name: 'Tickets réclamés', value: ticketsClaimed.toString(), inline: true },
                    { name: 'Moyenne des évaluations', value: `${averageRating}%`, inline: true }
                )
                .setColor(0x00ff00);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.log('Une erreur est survenue lors de l\'exécution de la commande /service :', error);
            interaction.reply({ content: "Une erreur s'est produite lors de l'affichage des statistiques de service.", ephemeral: true });
        }
    },
};
