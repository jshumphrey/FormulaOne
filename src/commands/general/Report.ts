import { ApplicationCommandRegistry, Awaitable, Command } from "@sapphire/framework";
import { ContextMenuInteraction, Message, Snowflake } from "discord.js";
import { Constants, ModerationQueueButtons } from "../../utility/Constants";
import { ModerationService, modQueue } from "../../services/ModerationService";
import { replyInteraction, replyInteractionError } from "../../utility/Sender";
import MutexManager from "../../managers/MutexManager";

export class ReportCommand extends Command {
  reports: Array<Snowflake>;

  public constructor(context: Command.Context) {
    super(context);
    this.reports = [];
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerContextMenuCommand(
      {
        name: "Report",
        type: "MESSAGE",
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["1031260226692857926"],
      }
    );
  }

  public async contextMenuRun(interaction: ContextMenuInteraction) {
    const message = interaction.options.getMessage("message") as Message;
    await MutexManager.getUserPublicMutex(message.author.id).runExclusive(async () => {
      if (interaction.guild == null || interaction.channel == null || message == null) {
        return;
      }
      if (interaction.user.id === message.author.id) {
        await replyInteractionError(interaction, "You may not report yourself.");
        return;
      }
      if (await ModerationService.isModerator(interaction.guild, message.author)) {
        await replyInteractionError(
          interaction,
          "You may not use this command on a moderator."
        );
        return;
      }
      if (!this.reports.includes(message.id)) {
        await modQueue(
          interaction.guild,
          message.author,
          interaction.channel.id,
          message.id,
          [
            "Action",
            `Report [Jump to message](${message.url})`,
            "Channel",
            interaction.channel.toString(),
            "Reporter",
            interaction.user.tag,
            "Content",
            message.content,
          ],
          Constants.WARN_COLOR,
          [
            ModerationQueueButtons.PUNISH,
            ModerationQueueButtons.ESCALATE,
            ModerationQueueButtons.IGNORE,
          ],
          `<@&${Constants.ROLES.MODS}>`
        );
        this.reports.push(message.id);
      }
      await replyInteraction(interaction, "Successfully reported message.");
    });
  }
}
