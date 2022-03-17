import {
  CommandInteraction,
  Message,
  MessageEmbedOptions,
  TextBasedChannel,
} from "discord.js";
import { StringUtil } from "./StringUtil";
import { Embed } from "../structures/Embed";
import { Constants } from "./Constants";

export async function replyMsg(
  message: Message,
  description: string
): Promise<Message> {
  return send(
    message.channel,
    `${StringUtil.boldify(message.author.tag)}, ${description}`
  );
}

export async function replyMsgError(
  message: Message,
  description: string
): Promise<Message> {
  return send(
    message.channel,
    `${StringUtil.boldify(message.author.tag)}, ${description}`,
    { color: Constants.ERROR_COLOR }
  );
}

export async function replyInteraction(
  interaction: CommandInteraction,
  description: string,
  embedOptions: MessageEmbedOptions = {}
) {
  return sendInteraction(
    interaction,
    `${StringUtil.boldify(interaction.user.tag)}, ${description}`,
    embedOptions
  );
}

export async function replyInteractionError(
  interaction: CommandInteraction,
  description: string,
  embedOptions: MessageEmbedOptions = {}
) {
  embedOptions.color = Constants.ERROR_COLOR;
  return sendInteraction(
    interaction,
    `${StringUtil.boldify(interaction.user.tag)}, ${description}`,
    embedOptions
  );
}

async function send(
  channel: TextBasedChannel,
  description: string,
  embedOptions: MessageEmbedOptions = {}
): Promise<Message> {
  embedOptions.description = description;
  return channel.send({ embeds: [new Embed(embedOptions)] });
}

async function sendInteraction(
  interaction: CommandInteraction,
  description: string,
  embedOptions: MessageEmbedOptions = {}
) {
  embedOptions.description = description;
  return interaction.reply({
    embeds: [new Embed(embedOptions)],
    ephemeral: true,
  });
}
