module.exports = {
    name: 'remove',
    description: 'Retire un utilisateur du ticket',
    options: [
        {
            name: 'user',
            description: 'Utilisateur à retirer',
            required: true,
            type: 6,
        },
    ],
    go: async (client, db, config, interaction, args) => {
        try {
            const user = interaction.options.getUser('user');
            if (!interaction.channel.topic) return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });

            await interaction.channel.permissionOverwrites.edit(user, { ViewChannel: false });

            interaction.reply({ content: `L'utilisateur ${user} a été retiré du ticket.`, ephemeral: true });
        } catch (error) {
            console.log('Une erreur est survenue lors de l\'exécution de la commande /removeuser :', error);
            interaction.reply({ content: "Une erreur s'est produite lors du retrait de l'utilisateur du ticket.", ephemeral: true });
        }
    },
};
