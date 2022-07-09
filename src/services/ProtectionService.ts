import { Guild } from "discord.js";
import { modLog } from "./ModerationService";
import { Constants } from "../utility/Constants";
import { getDBGuild } from "../utility/DatabaseUtil";
import db from "../database";

export default new (class ProtectionService {
  joinStats: { timestamp: number; joinedSince: number };

  constructor() {
    this.joinStats = { timestamp: Date.now(), joinedSince: 0 };
  }

  public async checkJoins(guild: Guild) {
    const now = Date.now();
    if (this.joinStats.timestamp + 15000 > Date.now()) {
      this.joinStats = {
        timestamp: this.joinStats.timestamp,
        joinedSince: this.joinStats.joinedSince + 1,
      };
      if (this.joinStats.joinedSince === 15) {
        const dbGuild = await getDBGuild(guild.id);
        if (
          guild.verificationLevel !== "VERY_HIGH" &&
          dbGuild?.protectionActivatedAt === 0
        ) {
          await guild.setVerificationLevel(
            "VERY_HIGH",
            `Protection activated at ${now}`
          );
          await modLog(
            guild,
            null,
            ["Action", "Protection Activated", "Verification Level", "VERY_HIGH"],
            Constants.BAN_COLOR
          );
        }
        await db.guildRepo?.upsertGuild(guild.id, {
          $set: { protectionActivatedAt: now },
        });
      }
    } else {
      this.joinStats = { timestamp: now, joinedSince: 0 };
    }
  }
})();