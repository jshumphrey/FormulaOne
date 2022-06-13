import {
  ApplicationCommandRegistry,
  Awaitable,
  Command,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import {
  ApplicationCommandOptionChoiceData,
  CommandInteraction,
  GuildMember,
} from "discord.js";
import { Constants } from "../../utility/Constants";
import { PunishUtil } from "../../utility/PunishUtil";

export class PunishCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      runIn: CommandOptionsRunTypeEnum.GuildText,
      preconditions: ["Marshals", "MemberValidation", "NoModerator"],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    const ruleChoices: Array<ApplicationCommandOptionChoiceData> = [];
    Constants.RULES.forEach((rule, i) => {
      ruleChoices.push({
        name: `Rule ${i + 1} - ${rule}`,
        value: i,
      });
    });

    registry.registerChatInputCommand(
      {
        name: this.name,
        description: "Adjust a member's punishments.",
        options: [
          {
            name: "add",
            description: "Add a punishment to a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to punish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the punish",
                type: "NUMBER",
                choices: ruleChoices,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a punishment from a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to unpunish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the unpunish",
                type: "STRING",
                required: true,
              },
            ],
          },
        ],
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["985885134408536104"],
      }
    );
  }

  public async chatInputRun(interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const targetMember = interaction.options.getMember("member") as GuildMember;
    let reason;
    if (subcommand === "add") {
      const ruleNumber = interaction.options.getNumber("reason");
      if (ruleNumber == null) {
        return;
      }
      reason = `Rule ${ruleNumber + 1} - ${Constants.RULES[ruleNumber]}`;
    } else if (subcommand === "remove") {
      reason = interaction.options.getString("reason");
    }
    if (reason == null) {
      return;
    }

    await PunishUtil.punish(
      interaction,
      interaction.member as GuildMember,
      targetMember,
      subcommand,
      reason,
      1
    );
  }
}
