import { GuildMember, User } from "discord.js";
import RE2 from "re2";
import { Constants } from "./Constants.js";

export function boldify(str: string) {
  return `**${str.replace(Constants.GLOBAL_REGEXES.MARKDOWN, "")}**`;
}

export function unlinkify(str: string) {
  return `\`${str.replace(Constants.GLOBAL_REGEXES.MARKDOWN, "")}\``;
}

export function upperFirstChar(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function maxLength(str: string) {
  if (str != null) {
    let cleanStr = str.replace(Constants.GLOBAL_REGEXES.ZERO_WIDTH, "");
    cleanStr = cleanStr.replace(new RE2(/\|{10,}/g), ""); // Replace 10 or more consecutive markdown spoiler characters
    return cleanStr.length > 500 ? `${cleanStr.substring(0, 500)}...` : cleanStr;
  }
  return str;
}

export function removeClickableLinks(str: string) {
  return str.replace(Constants.GLOBAL_REGEXES.URL, (url) => unlinkify(url));
}

export function getDisplayTag(member: GuildMember) {
  const userTag =
    member.user.discriminator === "0" ? member.user.username : member.user.tag;
  return member.displayName !== member.user.username
    ? `${member.displayName} (${userTag})`
    : userTag;
}

export function getUserTag(user: User) {
  return user.discriminator === "0" ? user.username : user.tag;
}
