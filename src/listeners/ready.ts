import { Listener } from "@sapphire/framework";
import { Client } from "discord.js";

export class ReadyListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
    });
  }

  public run(client: Client) {
    if (client.user != null) {
      this.container.logger.info(`${client.user.username} has successfully connected.`);
    }
  }
}
