import { Constants } from "./Constants.js";

export class StringUtil {
  static boldify(str: string) {
    return `**${str.replace(Constants.GLOBAL_REGEXES.MARKDOWN, "")}**`;
  }

  static unlinkify(str: string) {
    return `\`${str.replace(Constants.GLOBAL_REGEXES.MARKDOWN, "")}\``;
  }

  static upperFirstChar(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static removeClickableLinks(str: string) {
    const pattern = Constants.GLOBAL_REGEXES.URL;
    const urls = str.match(pattern);
    let returnVal = str;
    if (urls != null) {
      urls.forEach((url) => {
        returnVal = returnVal.replace(url, this.unlinkify(url));
      });
    }
    return returnVal;
  }
}
