import ip from "ip";
import moment from "moment-timezone";

export class License {
  private static calculateDays(startDate: string = ""): number {
    if (startDate != "") {
      const date = new Date(startDate);

      // Get today's date
      const today = new Date();

      date.setUTCHours(0, 0, 0, 0);
      today.setUTCHours(0, 0, 0, 0);
      // Calculate the difference in milliseconds between the two dates
      const differenceInMilliseconds = today.getTime() - date.getTime();

      // Convert milliseconds to days
      const differenceInDays = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;

      return differenceInDays;
    }
    return -1;
  }

  static async get(): Promise<any> {
    return "ok";
  }
}
