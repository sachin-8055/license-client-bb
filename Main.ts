import os from "os";
import fs from "fs";
import axios from "axios";
import { DeviceDetails, Response } from "./ResponseTypes";
import { sha256 } from "hash.js";
export class LicenseClient {
  private static hashString(input: string): string {
    const data = new TextEncoder().encode(input);

    const hash = sha256().update(data).digest("hex");

    return hash;
  }

  private static async getDeviceDetails(): Promise<DeviceDetails> {
    let _deviceDetails: DeviceDetails = {
      deviceId: "",
      osType: "",
      deviceType: "",
      browser: "",
    };

    if (typeof window === "object" && typeof window?.matchMedia === "function") {
      /** Browser level */
      const userAgent = window.navigator.userAgent;
      /** Type of device id Start */
      const navigatorData = `${navigator?.userAgent}${navigator?.language}${navigator?.platform || ""}`;
      const hashedData = this.hashString(navigatorData); // Example: Using a hashing function (SHA-256) to generate a unique ID
      _deviceDetails.deviceId = hashedData;
      /** Type of device id Start */

      /** Type of OS Start */
      if (/Windows/.test(userAgent)) {
        _deviceDetails.osType = "Windows";
      } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
        _deviceDetails.osType = "Mac OS";
      } else if (/Android/.test(userAgent)) {
        _deviceDetails.osType = "Android";
      } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        _deviceDetails.osType = "iOS";
      } else {
        _deviceDetails.osType = "Unknown";
      }

      /** Type of OS END */

      /** Type of Browser Start */
      if (/Edge/.test(userAgent)) {
        _deviceDetails.browser = "Edge";
      } else if (/Chrome/.test(userAgent)) {
        _deviceDetails.browser = "Chrome";
      } else if (/Safari/.test(userAgent)) {
        _deviceDetails.browser = "Safari";
      } else if (/Firefox/.test(userAgent)) {
        _deviceDetails.browser = "Firefox";
      } else if (/Opera/.test(userAgent)) {
        _deviceDetails.browser = "Opera";
      } else {
        _deviceDetails.browser = "Unknown";
      }

      /** Type of Browser End */

      /** Type of Device Start */
      if (window.matchMedia("(max-width: 768px)").matches) {
        _deviceDetails.deviceType = "Mobile";
      } else {
        _deviceDetails.deviceType = "Desktop";
      }

      /** Type of Device END */
    } else {
      /** Physical system level */
      const platform = process?.platform || os.platform();
      /** Type of Device ID Start */

      const _host = process?.env?.HOSTNAME || os.hostname();

      const systemInfo = `${_host || ""}${process?.arch || ""}${platform}${process?.version||""}`;

      const hashedData = this.hashString(systemInfo);
      _deviceDetails.deviceId = hashedData;

      /** Type of Device ID End */

      /** Type of OS Start */
      if (platform?.toLowerCase() === "linux") {
        _deviceDetails.osType = "Linux";
      } else if (platform?.toLowerCase() === "darwin") {
        _deviceDetails.osType = "Mac";
      } else if (platform?.toLowerCase() === "win32") {
        _deviceDetails.osType = "Windows";
      } else {
        _deviceDetails.osType = "Unknown";
      }

      /** Type of OS END */

      /** Type of Device Start */

      if (fs.existsSync("/proc/1/cgroup")) {
        fs.readFile("/proc/1/cgroup", "utf8", (err, data) => {
          if (err) {
            console.error("Error reading /proc/1/cgroup to identify MACHINE :", err);
          } else {
            if (data.includes("/docker/")) {
              _deviceDetails.deviceType = "Docker";
            } else if (data.includes("/machine.slice/machine-qemu")) {
              _deviceDetails.deviceType = "Virtual Machine";
            } else if (data.includes("/machine.slice/machine-vmware")) {
              _deviceDetails.deviceType = "Virtual Machine";
            } else {
              _deviceDetails.deviceType = "Server";
            }
          }
        });
      } else {
        _deviceDetails.deviceType = "Server";
      }
      /** Type of Device END */
    }

    return _deviceDetails;
  }

  static async addDevice(licenseKey: string, baseUrl: String): Promise<Response> {
    try {
      if (!licenseKey) {
        console.error(`License key should't be blank '${licenseKey}'.`);
        throw new Error(`License key should't be blank '${licenseKey}'.`);
      }
      if (!baseUrl) {
        console.error(`Base URL should't be blank '${baseUrl}'.`);
        throw new Error(`Base URL should't be blank '${baseUrl}'.`);
      }

      let deviceDetails = await this.getDeviceDetails();

      let apiBody = {
        licenseKey,
        ...deviceDetails,
      };

      return await axios
        .post(`${baseUrl}/sdk/api/add-device`, apiBody, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(async (res: any) => {
          if (res.data?.data) {
            return res.data;
          } else {
            console.error(`Fail to add/update device on license server.`);
            throw new Error(`Fail to add/update device on license server.`);
          }
        })
        .catch((err: any) => {
          if (err?.code == "ECONNREFUSED" || err?.message?.includes("ECONNREFUSED")) {
            console.error("Unable to connect License server :", err?.message);
            throw new Error(
              err instanceof Error
                ? `Unable to connect License server : ${err?.message}`
                : "Something went wrong at licensing server end."
            );
          }
          console.debug(
            "License Server Response : ",
            `Status: ${err?.response?.status} : ${err?.message} : `,
            err?.response?.data
          );

          let _errorMsg = err?.response?.data?.message || "Fail to get add device from server.";

          console.error({ _errorMsg });
          throw new Error(_errorMsg);
        });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Fail to add device details.");
    }
  }
}
