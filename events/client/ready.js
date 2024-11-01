module.exports = (client, db, config) => {
    client.box(`[BOT] => ON [${client.user.tag}]`);
    client.user.setPresence({
        activities: [{ name: 'Tickets', type: 1, url: 'https://twitch.tv/#' }],
        status: 'dnd'
    });
}