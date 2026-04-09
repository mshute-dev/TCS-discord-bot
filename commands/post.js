//import tool from discord.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        //create /post command
        .setName('post')
        .setDescription('Sends a POST request to Google and returns the raw HTML response')
        //user input
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('What to search on Google (ex. Tarleton)')
                .setRequired(true)
        ),
    //execute function
    async execute(interaction) {
        await interaction.deferReply();
        //user input saved as variable 'query'
        const query = interaction.options.getString('query');

        try {
            const startTime = Date.now();
            //gooogle search URL
            const response = await fetch('https://www.google.com/search', {
                //specifies this is a POST request
                method: 'POST',
                headers: {
                    //google expects browser form
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //request is made like it's coming from real chrome browser
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                //query being sent
                body: `q=${encodeURIComponent(query)}`,
            });
            //reads responce as raw HTML
            const rawHTML = await response.text();
            //discord has 2k word limit so I truncated the response
            const truncated = rawHTML.length > 1900
                ? rawHTML.substring(0, 1900) + '\n...[truncated]'
                : rawHTML;
            //response sent back to discord
            const responseTime = Date.now() - startTime;
            await interaction.editReply(
                `**Status:** ${response.status}\n**Response Time:** ${responseTime}ms\n**Bot Latency:** ${Math.round(interaction.client.ws.ping)}ms\n\`\`\`html\n${truncated}\n\`\`\``
            );
        //error handling because google may be down, invalid URL, poor internet etc..
        } catch (error) {
            console.error('POST command error:', error);
            await interaction.editReply(`Request failed: ${error.message}`);
        }
    },
};