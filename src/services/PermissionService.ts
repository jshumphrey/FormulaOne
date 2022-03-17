import { Constants } from "../utility/Constants";
import { container } from "@sapphire/framework";
import { ApplicationCommandPermissionData } from "discord.js";

export class PermissionService {
  public static async register() {
    const marshalCommands = ["954020435652128848"];
    const marshalPermissions: Array<ApplicationCommandPermissionData> = [];
    Constants.MOD_ROLES.filter(
      (marshalRole) => marshalRole.permissionLevel > 0
    ).forEach((marshalRole) => {
      marshalPermissions.push({ id: marshalRole.id, type: "ROLE", permission: true });
    });
    const guild = container.client.guilds.cache.get(Constants.GUILD_IDS[0]);
    if (guild == null) {
      return;
    }
    for (const commandId of marshalCommands) {
      const command = await guild.commands.fetch(commandId);
      if (command != null) {
        await command.permissions.add({ permissions: marshalPermissions });
      }
    }
  }
}