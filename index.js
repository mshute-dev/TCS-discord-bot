require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const deployCommands = async () => {
    try {
        const commands = [];

        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`WARNING: The command at ${file} is missing a required 'data' or 'execute' property.`);
            }
        }
    

    const rest = new REST().setToken(process.env.BOT_TOKEN);

    console.log(`Started refreshing application slash commands globally.`);

    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
    );

    console.log('Successfully reloaded all commands!');
    } catch (error) {
        console.error('Error deploying commands:', error)
    }
}

const {
	Client,
	GatewayIntentBits,
	Partials,
	Collection,
	ActivityType,
	PresenceUpdateStatus,
	Events
} = require('discord.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers	
	],
	partials: 
	[
		Partials.Channel,
		Partials.Message,
		Partials.User,
		Partials.GuildMember
	]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles){
	const filepath = path.join(commandsPath, file);
	const command = require(filepath);

	if('data' in command && 'execute' in command){
		client.commands.set(command.data.name, command);
	} else{
		console.log(`Command ${filepath} is missing requirements`);
	}
}

client.once(Events.ClientReady, async () => {
	console.log(`Logged in as ${client.user.tag}`);

	// Command Deployment
	await deployCommands();
	console.log('Commands Loaded');

	const statusType = process.env.BOT_STATUS || 'online';
	const activityType = process.env.ACTIVITY || 'PLAYING';
	const activityName = process.env.ACTIVITY_NAME || 'TCS STUFF';

	const activityTypeMap = {
		'PLAYING': ActivityType.Playing,
		'WATCHING': ActivityType.Watching,
		'LISTENING': ActivityType.Listening,
		'STREAMING': ActivityType.Streaming,
		"COMPETING": ActivityType.Competing
	};

	const statusMap = {
		'online': PresenceUpdateStatus.Online,
		'dnd': PresenceUpdateStatus.DoNotDisturb,
		'invisible': PresenceUpdateStatus.Invisible,
		'idle': PresenceUpdateStatus.Idle
	};

	client.user.setPresence({
		status: statusMap[statusType],
		activities: [{
			name: activityName,
			type: activityTypeMap[activityType]
		}]
	});

	console.log(`Status: ${statusType} ${activityType}`);

})

client.on(Events.InteractionCreate, async interaction =>{
    if(!interaction.isChatInputCommand()) return;        

	const command = client.commands.get(interaction.commandName);

	if(!command){
		//console.error(`No matching command -- ${interaction.command}`);
		return;
	}

	try{
		await command.execute(interaction);
	} catch(error){
		console.error(error);
		if(interaction.replied || interaction.deferred){
			await interaction.followUp({content: `There was an error in execution!`, ephemeral: true});
		} else{
			await interaction.reply({content: `There was an error in execution`, ephemeral:true});
		}
	}
});

client.login(process.env.BOT_TOKEN);