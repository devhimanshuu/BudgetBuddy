require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const APP_ID = process.env.DISCORD_APP_ID || "1510015130547654717";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error("Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN in .env");
  process.exit(1);
}

const commands = [
  {
    name: "start",
    description: "Get your Discord User ID to link your BudgetBuddy account",
    type: 1 // CHAT_INPUT
  },
  {
    name: "log",
    description: "Log a new transaction",
    type: 1,
    options: [
      {
        name: "text",
        description: "Describe the transaction (e.g. '50 for food')",
        type: 3, // STRING
        required: false
      },
      {
        name: "receipt",
        description: "Upload a photo of a receipt",
        type: 11, // ATTACHMENT
        required: false
      },
      {
        name: "voice",
        description: "Upload a voice note (.ogg or .mp3)",
        type: 11, // ATTACHMENT
        required: false
      }
    ]
  },
  {
    name: "chat",
    description: "Chat with your AI financial advisor",
    type: 1,
    options: [
      {
        name: "message",
        description: "Your question",
        type: 3,
        required: true
      }
    ]
  }
];

async function registerCommands() {
  console.log("Registering Discord Slash Commands...");
  const response = await fetch(
    `https://discord.com/api/v10/applications/${APP_ID}/commands`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${BOT_TOKEN}`
      },
      body: JSON.stringify(commands)
    }
  );

  if (response.ok) {
    console.log("✅ Commands registered successfully!");
  } else {
    const error = await response.text();
    console.error("❌ Failed to register commands:", error);
  }
}

registerCommands();
