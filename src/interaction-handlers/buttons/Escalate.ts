import {
  container,
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ButtonInteraction,
  Guild,
  TextChannel,
  APIEmbed,
  GuildMember,
} from "discord.js";
import { escalate, isModerator } from "../../services/ModerationService.js";
import TryVal from "../../utility/TryVal.js";
import { Constants, ModerationQueueButtons } from "../../utility/Constants.js";
import MutexManager from "../../managers/MutexManager.js";
import { replyInteraction, replyInteractionError } from "../../utility/Sender.js";
import { archiveLog } from "../../services/BotQueueService.js";
import ViolationService from "../../services/ViolationService.js";

export class Escalate extends InteractionHandler {
  public constructor(context: never) {
    super(context, {
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    parsedData: InteractionHandler.ParseResult<this>,
  ) {
    if (interaction.guild == null) {
      return;
    }
    if (!(await isModerator(interaction.guild, interaction.user))) {
      await replyInteractionError(
        interaction,
        "You must be a Marshal in order to use this command.",
      );
      return;
    }
    await MutexManager.getUserMutex(parsedData.targetUserId).runExclusive(async () => {
      if (ViolationService.handled.includes(interaction.message.id)) {
        await replyInteractionError(interaction, "Log has already been handled.");
        return;
      }
      if (interaction.member == null) {
        return;
      }
      const logMessage = await TryVal(
        (interaction.channel as TextChannel).messages.fetch(interaction.message.id),
      );
      if (logMessage == null) {
        return;
      }
      const embed = interaction.message.embeds.at(0) as APIEmbed;
      if (embed == null) {
        return;
      }
      const targetUser = await TryVal(
        container.client.users.fetch(parsedData.targetUserId),
      );
      if (targetUser == null) {
        return;
      }
      const escalationSent = await escalate(
        interaction.guild as Guild,
        interaction.member as GuildMember,
        targetUser,
        parsedData.targetChannelId,
        parsedData.targetMessageId,
        embed,
        [
          ModerationQueueButtons.PUNISH,
          ModerationQueueButtons.BAN,
          ModerationQueueButtons.IGNORE,
        ],
      );
      if (escalationSent == null) {
        await replyInteractionError(interaction, "Error escalating log.");
        return;
      }
      const messageSent = await archiveLog(
        interaction.guild as Guild,
        interaction.channel as TextChannel,
        parsedData.targetUserId,
        interaction.member as GuildMember,
        logMessage,
        "Escalated",
      );
      if (messageSent) {
        await replyInteraction(interaction, "Successfully escalated log.", {
          color: Constants.UNMUTE_COLOR,
        });
        ViolationService.handled.push(interaction.message.id);
      } else {
        await replyInteractionError(interaction, "Error escalating log.");
      }
    });
  }

  public parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("escalate-")) {
      return this.none();
    }
    const split = interaction.customId.split("-");
    split.shift();
    const [targetUserId, targetChannelId, targetMessageId] = split;
    return this.some({ targetUserId, targetChannelId, targetMessageId });
  }
}
