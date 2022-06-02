import "@sapphire/plugin-logger/register";
import credentials from "./credentials.json";
import db from "./database";
import {
  ApplicationCommandRegistries,
  RegisterBehavior,
  SapphireClient,
  container,
} from "@sapphire/framework";
import { Constants } from "./utility/Constants";

declare module "@sapphire/framework" {
  interface Preconditions {
    BannedUser: never;
    MemberValidation: never;
    NoModerator: never;
    F2: never;
    F3: never;
    Helpers: never;
    Marshals: never;
    Stewards: never;
  }
}

(async () => {
  const client = new SapphireClient({
    defaultPrefix: Constants.PREFIX,
    intents: Constants.INTENTS,
    presence: Constants.PRESENCE,
    loadMessageCommandListeners: true,
  });
  ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
    RegisterBehavior.Overwrite
  );
  const start = Date.now();
  container.logger.info("Database: Connecting...");
  await db.connect(credentials.mongodbConnectionURL, credentials.dbName);
  container.logger.info(`Database: Took ${Date.now() - start}ms to connect.`);
  await client.login(credentials.token);
})().catch((err) => container.logger.error(err));
