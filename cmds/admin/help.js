module.exports = {
    name: "help",
    dm: true,
    description: "Retourne toutes les commandes",
    type: 1,
    go: async (client, db, config, interaction, args) => {
        if (!db.get(`Owner_${interaction.guild.id}-${interaction.user.id}`) && !db.get(`Wl_${interaction.guild.id}-${interaction.user.id}`) && !config.owners.includes(interaction.user.id) && interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: `\`❌\` *Vous n'avez pas les permission pour executé cette commande*`, ephemeral: true });
        await interaction.deferReply();
        const prevButton = client.button().setLabel("Prev").setCustomId("prev").setStyle(1);
        const nextButton = client.button().setLabel("Next").setCustomId("next").setStyle(3);

        const row = client.row().addComponents(prevButton, nextButton);

        let currentPage = 0;
        let categories = [];

        const showCategory = async (catIndex) => {

            const embed = client.embed();
            const cat = categories[catIndex];
            const tCommands = client.cmds.filter((cmd) => cmd.class === cat);
            const category = {
                admin: "`🔰` Commandes Admin",
                blacklist: "`🎎` Commandes Blacklist",
                blrank: "`🧧` Commandes Blrank",
                limitrole: "`📇` Commandes Limitrole",
                voicemaster: "`🔊` Commandes Voice Master",
                dog: "`🐕` Commandes Dog",
                punish: "`⚖️` Commandes Punish",
                antistats: "`📈` Commandes Stats",
                watcher: "`🥽` Commandes watcher",
                gestion: "`🎩` Commandes gestion",
                giveaways: "`🎉` Commandes Giveaways",
                logs: "`📰` Commandes Logs"
            };
            embed.setTitle(`${category[cat.toLowerCase()]} :`);
            embed.setDescription(tCommands.map((cmd) => "`=> /" + cmd.name + " - " + cmd.description + "`").join("\n"));
            await interaction.editReply({ embeds: [embed], components: [row] });
        };

        // Déterminer les catégories
        client.cmds.forEach(async (command) => {
            if (!categories.includes(command.class)) categories.push(command.class);
        });

        await showCategory(currentPage);

       
        const filter = (interaction) => {
            return interaction.customId === "prev" || interaction.customId === "next";
        };

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 99999999 });

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "prev") {
                if (currentPage === 0) {
                    currentPage = categories.length - 1;
                } else {
                    currentPage--;
                }
            } else if (interaction.customId === "next") {
                currentPage = (currentPage + 1) % categories.length;
            }
            await showCategory(currentPage);
            const reply = await interaction.reply({ content: "Page mise à jour", ephemeral: true });
    setTimeout(() => {
        reply.delete().catch(console.error);
    }, 200);
        });

        collector.on("end", () => {
           
            row.components.forEach((button) => button.setDisabled(true));
            interaction.editReply({ components: [row] });
        });
    }
};
