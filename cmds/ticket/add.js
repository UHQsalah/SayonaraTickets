module.exports = {
    name: 'adduser',
    description: 'Ajoute un utilisateur au ticket',
    options: [
        {
            name: 'user',
            description: 'Utilisateur à ajouter',
            required: true,
            type: 6,
        },
    ],
    go: async (client, db, config, interaction, args) => {
        try {
            const user = interaction.options.getUser('user');
            if (!interaction.channel.topic) return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
            client.info(`${interaction.user.tag} (${interaction.user.id}) => /adduser`)

            await interaction.channel.permissionOverwrites.create(user, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            interaction.reply({ content: `L'utilisateur ${user} a été ajouté au ticket.`, ephemeral: true });
        } catch (error) {
            client.error(error);
            interaction.reply({ content: "Une erreur s'est produite lors de l'ajout de l'utilisateur au ticket.", ephemeral: true });
        }
    },
};
