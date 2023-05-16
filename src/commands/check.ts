import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { ChainPatrolApiClient, AssetType } from "../utils/ChainPatrolApiClient";
import { defangUrl } from "../utils/url";

export const data = new SlashCommandBuilder()
  .setName("check")
  .setDescription("checks a link to see if it's a scam")
  .addStringOption((option) =>
    option.setName("url").setDescription("The link to check").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    const { options } = interaction;
    const url = options.getString("url", true);
    const replyMessage = await checkAsset(url);

    await interaction.reply(replyMessage);
  } catch (error) {
    // Handle errors
    console.error("error", error);

    await interaction.reply({
      content: "Error with checking link",
      ephemeral: true,
    });
  }
}

export async function checkAsset(url: string) {
  const escapedUrl = defangUrl(url);

  // check url
  const response = await ChainPatrolApiClient.checkAsset({
    content: url,
    type: AssetType.URL,
  });

  if (response.status === "BLOCKED") {
    return {
      content: `🚨 **Alert** 🚨 \n\nThis link is a scam! \`${escapedUrl}\` \n\n_Please **DO NOT** click on this link._`,
      ephemeral: true,
    };
  } else if (response.status === "ALLOWED") {
    return {
      content: `✅ This link looks safe! \`${escapedUrl}\``,
      ephemeral: true,
    };
  } else if (response.status === "UNKNOWN") {
    return {
      content: `⚠️ **Warning** ⚠️ \n\nThis link is not currently in our database: \`${escapedUrl}\` \n\n_Please be careful and **DO NOT** click on this link unless you are sure it's safe._`,
      ephemeral: true,
    };
  } else {
    return {
      content: `❓ We're not sure about this link. \`${escapedUrl}\``,
      ephemeral: true,
    };
  }
}
