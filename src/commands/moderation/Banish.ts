import {
  ApplicationCommandRegistry,
  Awaitable,
  Command,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import {
  ApplicationCommandOptionChoice,
  CommandInteraction,
  GuildMember,
} from "discord.js";
import db from "../../database";
import {
  dm,
  replyInteractionError,
  replyInteractionPublic,
} from "../../utility/Sender";
import { Constants } from "../../utility/Constants";
import { ModerationService, modLog } from "../../services/ModerationService";
import { StringUtil } from "../../utility/StringUtil";
import { PushUpdate } from "../../database/updates/PushUpdate";

export class BanishCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      requiredClientPermissions: ["MANAGE_ROLES"],
      runIn: CommandOptionsRunTypeEnum.GuildText,
      preconditions: ["Helpers"],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    const choices: Array<ApplicationCommandOptionChoice> = [];
    Constants.BANISH_ROLES.forEach((role) =>
      choices.push({ name: role.name, value: role.roleId })
    );
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: "Banish a member from a channel.",
        options: [
          {
            name: "add",
            description: "Add a banished role to a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to banish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the banish",
                type: "STRING",
                required: true,
              },
              {
                name: "channel",
                description: "The channel to banish the member from",
                type: "STRING",
                choices,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a banished role from a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to unbanish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the unbanish",
                type: "STRING",
                required: true,
              },
              {
                name: "channel",
                description: "The channel to unbanish the member from",
                type: "STRING",
                choices,
                required: true,
              },
            ],
          },
        ],
        defaultPermission: false,
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["956174760688115783"],
      }
    );
  }

  public async chatInputRun(interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.options.getMember("member") as GuildMember;
    const reason = interaction.options.getString("reason");
    const roleId = interaction.options.getString("channel");
    if (member == null) {
      await replyInteractionError(interaction, "Member not found.");
      return;
    }
    if (roleId == null) {
      return;
    }
    const banishedRole = Constants.BANISH_ROLES.find(
      (banishRole) => banishRole.roleId === roleId
    );
    if (
      interaction.guild == null ||
      interaction.channel == null ||
      reason == null ||
      banishedRole == null
    ) {
      return;
    }
    const helper =
      (await ModerationService.getPermLevel(interaction.guild, interaction.user)) === 0;
    if (helper && banishedRole.name !== "f1-beginner-questions") {
      await replyInteractionError(
        interaction,
        "Helpers may only banish members from the f1-beginner-questions channel."
      );
      return;
    }
    if (await ModerationService.isModerator(interaction.guild, member.user)) {
      await replyInteractionError(
        interaction,
        "You may not use this command on a moderator."
      );
      return;
    }
    const role = interaction.guild.roles.cache.get(roleId);
    const channel = interaction.guild.channels.cache.get(banishedRole.channelId);
    if (role == null || channel == null) {
      await replyInteractionError(interaction, "Could not fetch target role/channel.");
      return;
    }
    if (subcommand === "add") {
      if (member.roles.cache.has(roleId)) {
        await replyInteractionError(
          interaction,
          `${StringUtil.boldify(
            member.user.tag
          )} is already banished from ${channel.toString()}`
        );
        return;
      }
      const action = `${helper ? "Helper " : ""}${banishedRole.name} Banish`;
      await member.roles.add(roleId);
      await replyInteractionPublic(
        interaction,
        `Successfully banished ${StringUtil.boldify(
          member.user.tag
        )} from ${channel.toString()}`
      );
      await db.userRepo?.upsertUser(
        member.id,
        interaction.guild.id,
        new PushUpdate("punishments", {
          date: Date.now(),
          escalation: action,
          reason,
          mod: interaction.user.tag,
          channelId: interaction.channel.id,
        })
      );
      await modLog(
        interaction.guild,
        interaction.user,
        [
          "Action",
          action,
          "Member",
          `${member.user.tag.toString()} (${member.id})`,
          "Reason",
          reason,
          "Channel",
          interaction.channel.toString(),
        ],
        Constants.BANISH_COLOR,
        member.user
      );
      await dm(
        member.user,
        `A moderator has banished you from the ${banishedRole.name} channel.`,
        interaction.channel
      );
    } else if (subcommand === "remove") {
      if (!member.roles.cache.has(roleId)) {
        await replyInteractionError(
          interaction,
          `${StringUtil.boldify(
            member.user.tag
          )} is not banished from ${channel.toString()}`
        );
        return;
      }
      const action = `${helper ? "Helper " : ""}${banishedRole.name} Unbanish`;
      await member.roles.remove(roleId);
      await replyInteractionPublic(
        interaction,
        `Successfully unbanished ${StringUtil.boldify(
          member.user.tag
        )} from ${channel.toString()}`
      );
      await modLog(
        interaction.guild,
        interaction.user,
        [
          "Action",
          action,
          "Member",
          `${member.user.tag.toString()} (${member.id})`,
          "Reason",
          reason,
          "Channel",
          interaction.channel.toString(),
        ],
        Constants.UNMUTE_COLOR,
        member.user
      );
      await dm(
        member.user,
        `A moderator has unbanished you from the ${banishedRole.name} channel.`,
        interaction.channel
      );
    }
  }
}
