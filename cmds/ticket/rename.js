module.exports = {
    name: 'rename',
    description: 'Renomme le ticket',
    options: [
        {
            name: 'newname',
            description: 'Nouveau nom pour le ticket',
            required: true,
            type: 3,
        },
    ],
    go: async (client, db, config, interaction, args) => {
        try {
            const newName = interaction.options.getString('newname');
            if (!interaction.channel.topic) return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });

            await interaction.channel.setName(newName);
            interaction.reply({ content: `Le ticket a été renommé en ${newName}.`, ephemeral: true });
        } catch (error) {
            console.error('Une erreur est survenue lors de l\'exécution de la commande /rename :', error);
            interaction.reply({ content: "Une erreur s'est produite lors du renommage du ticket.", ephemeral: true });
        }
    },
};
