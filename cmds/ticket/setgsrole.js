module.exports = {
    name: 'setgsrole',
    description: 'Définir le rôle pour la gestion du staff.',
    options: [{
        name: 'role',
        description: "Le rôle à définir pour la gestion du staff.",
        type: 8,
        required: true
    }],
    go: async (client, db, config, interaction, args) => {
        try {
            // Vérifie si l'utilisateur a les permissions nécessaires pour exécuter cette commande
            if (!db.get(`Owner_${interaction.guild.id}-${interaction.user.id}`) && !config.owners.includes(interaction.user.id) && interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({ content: `\`❌\` *Vous n'avez pas les permissions pour exécuter cette commande*`, ephemeral: true });
            }

            // Récupère le rôle spécifié par l'utilisateur dans les options de la commande
            const role = interaction.options.getRole('role');

            
            
            db.set(`gsrole_${interaction.guild.id}`, role.id);

            // Répond à l'utilisateur pour confirmer que le rôle pour la gestion du staff a été défini avec succès
            interaction.reply({
                content: `Le rôle pour la gestion du staff a été défini sur ${role}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Une erreur est survenue lors de l\'exécution de la commande /setgsrole :', error);
            interaction.reply({
                content: 'Une erreur est survenue lors du traitement de votre commande.',
                ephemeral: true
            });
        }
    },
};
