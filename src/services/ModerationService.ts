import {
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  MessageButton,
  MessageEmbedOptions,
  MessageOptions,
  User,
} from "discord.js";
import { container } from "@sapphire/framework";
import { Constants } from "../utility/Constants";
import { send } from "../utility/Sender";
import { NumberUtil } from "../utility/NumberUtil";
import TryVal from "../utility/TryVal";

export class ModerationService {
  public static async getPermLevel(guild: Guild, user: User) {
    const member = (await TryVal(guild.members.fetch(user))) as GuildMember;
    if (!member) {
      return 0;
    }
    const modRoles = Constants.MOD_ROLES.sort(
      (a, b) => b.permissionLevel - a.permissionLevel
    );
    const permLevel =
      modRoles.find((modRole) => member.roles.cache.has(modRole.id)) ?? 0;
    return member.permissions.has("ADMINISTRATOR") && permLevel < 2 ? 2 : permLevel;
  }

  public static async isModerator(guild: Guild, user: User) {
    return user.bot || (await this.getPermLevel(guild, user)) > 0;
  }
}

export function modLog(
  guild: Guild,
  moderator: User,
  fieldsAndValues: Array<string>,
  color: number,
  target?: User
) {
  const logChannel = guild.channels.cache.get(Constants.CHANNELS.MOD_LOGS);
  if (logChannel == null) {
    container.logger.error("logChannel is null or undefined.");
  }

  const messageOptions: MessageOptions = {};
  const embedOptions: MessageEmbedOptions = {
    author: {
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL(),
    },
    color,
    timestamp: new Date(),
  };

  if (target != null) {
    const buttons = [
      [
        new MessageButton()
          .setCustomId(`userid-${target.id}`)
          .setLabel("User ID")
          .setStyle("SECONDARY"),
      ],
    ];
    messageOptions.components = buttons.map((b) => ({ type: 1, components: b }));
  }

  embedOptions.fields = [];

  for (let i = 0; i < fieldsAndValues.length - 1; i += 1) {
    if (NumberUtil.isEven(i)) {
      embedOptions.fields.push({
        name: fieldsAndValues[i],
        value: fieldsAndValues[i + 1].toString(),
      });
    }
  }

  return send(
    logChannel as GuildTextBasedChannel,
    undefined,
    embedOptions,
    messageOptions
  );
}

export function modLogCustom(guild: Guild, message: string, author: User) {
  const logChannel = guild.channels.cache.get(Constants.CHANNELS.MOD_LOGS);
  if (logChannel == null) {
    container.logger.error("logChannel is null or undefined.");
  }

  const embedOptions: MessageEmbedOptions = {
    author: {
      name: author.tag,
      iconURL: author.displayAvatarURL(),
    },
  };

  return send(logChannel as GuildTextBasedChannel, message, embedOptions);
}
