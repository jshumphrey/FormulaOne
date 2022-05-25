import { ApplicationCommandRegistry, Awaitable, Command } from "@sapphire/framework";
import { CommandInteraction, TextBasedChannel } from "discord.js";
import {
  replyInteractionError,
  replyInteractionPublic,
  send,
} from "../../utility/Sender";
import { Constants } from "../../utility/Constants";
import { genericLog } from "../../services/ModerationService";

export class EmojiCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      requiredClientPermissions: ["ADD_REACTIONS"],
      preconditions: ["F3"],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: "Post an emoji submission to #emojis.",
        options: [
          {
            name: "name",
            description: "The suggested emoji name",
            type: "STRING",
            required: true,
          },
          {
            name: "image",
            description: "The suggested emoji image",
            type: "ATTACHMENT",
            required: true,
          },
        ],
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["978981313354825778"],
      }
    );
  }

  public async chatInputRun(interaction: CommandInteraction) {
    const name = interaction.options.getString("name")?.replaceAll(":", "");
    const attachment = interaction.options.getAttachment("image");
    if (interaction.guild == null || name == null) {
      return;
    }
    if (attachment == null || attachment.height == null || attachment.width == null) {
      await replyInteractionError(
        interaction,
        "That is not a valid file type, please make sure you upload an image or video."
      );
      return;
    }

    const emojiChannel = interaction.guild.channels.cache.get(
      Constants.CHANNELS.EMOJIS
    ) as TextBasedChannel;
    if (emojiChannel == null) {
      return;
    }
    const options = {
      timestamp: new Date(),
      author: {
        name: interaction.user.tag,
        icon_url: interaction.user.displayAvatarURL(),
      },
      image: {
        url: attachment.url,
      },
    };

    const sentMessage = await send(
      emojiChannel,
      `Proposed the emote :${name}:`,
      options
    );
    await sentMessage.react(Constants.EMOTES.UP);
    await sentMessage.react(Constants.EMOTES.DOWN);
    await replyInteractionPublic(
      interaction,
      `Successfully proposed the emote :${name}:.`
    );

    await genericLog(
      interaction.guild,
      interaction.user,
      [
        "Action",
        `Suggested emoji [Jump to suggestion](${sentMessage.url})`,
        "Name",
        name,
      ],
      Constants.LIGHT_ORANGE_COLOR
    );
  }
}
