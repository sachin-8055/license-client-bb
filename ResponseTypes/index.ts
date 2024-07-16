export interface DeviceDetails {
  deviceId: string | undefined;
  osType: string | undefined;
  deviceType?: "Desktop" | "Mobile" | string | undefined;
  browser?: string | undefined | "";
}

export interface Response {
  data: string | object | null;
  message: "";
}
