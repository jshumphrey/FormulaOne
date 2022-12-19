import { ChatInputCommandErrorPayload, Listener, UserError } from "@sapphire/framework";
import Sentry from "@sentry/node";
import { replyInteractionError } from "../utility/Sender.js";

export class ChatInputCommandDeniedListener extends Listener {
  public async run(error: UserError, { interaction }: ChatInputCommandErrorPayload) {
    await replyInteractionError(interaction, error.message);
    this.container.logger.error(
      `Unsuccessful (error) command result - ${interaction.user.tag} - ${interaction.commandName} - ${error.message}`
    );
    Sentry.captureException(error);
  }
}
