export function getInternetIdentityNetwork() {
  const canisterId = process.env.CANISTER_ID_INTERNET_IDENTITY;
  const network = process.env.DFX_NETWORK;

  if (!canisterId) {
    console.warn("CANISTER_ID_INTERNET_IDENTITY is not set.");
    return null;
  }

  if (network === "local") {
    return `http://${canisterId}.localhost:4943`;
  } else {
    return `https://identity.ic0.app`;
  }
}

export function convertE8sToToken(e8s) {
  if (!e8s) return 0;
  const cleanE8s = e8s.toString().replace(/,/g, "").replace(/_/g, "");
  const number = parseInt(cleanE8s) / 100_000_000;
  const decimalStr = number.toString();

  if (!decimalStr.includes(".") || !parseFloat(decimalStr.split(".")[1])) {
    return Math.floor(number);
  }

  return parseFloat(number.toString());
}

export function convertTokenToE8s(token) {
  if (!token) return 0;
  const value = Math.floor(token * 100_000_000);
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_");
}

export function getStorageNetwork() {
  const canisterId = process.env.CANISTER_ID_STORAGE;
  const network = process.env.DFX_NETWORK;

  if (!canisterId) {
    console.warn("CANISTER_ID_STORAGE is not set.");
    return null;
  }

  if (network === "local") {
    return `http://${canisterId}.localhost:4943`;
  } else {
    return `https://${canisterId}.icp0.io`;
  }
}

export function jsonStringify(data) {
  return JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v));
}

export function formatTimestamp(initialTimestamp, label = "Last updated: ") {
  let timestamp = typeof initialTimestamp === "bigint" ? Number(initialTimestamp) : initialTimestamp;
  const now = Date.now();
  const inputTime = timestamp / 1_000; // Ubah ke millisecond
  const diff = Math.floor((now - inputTime) / 1000); // Konversi ke detik

  let timeString = diff < 60 ? `${diff} Seconds ago` : diff < 3600 ? `${Math.floor(diff / 60)} Minutes ago` : diff < 86400 ? `Yesterday` : diff < 604800 ? `${Math.floor(diff / 86400)} Days ago` : `${Math.floor(diff / 604800)} Weeks ago`;

  return label + timeString;
}

export function mapOptionalToFormattedJSON(data) {
  if (!data || typeof data !== "object") return data;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return [key, null]; // Jika kosong, jadi null
        if (value.length === 1) return [key, value[0]]; // Jika satu elemen, jadi string
        return [key, value.flat()]; // Jika nested array, flatten
      }

      return [key, value];
    })
  );
}

export function unixToDateString(unix) {
  return new Date(Number(unix) * 1000).toISOString().split("T")[0];
}

export function toUnixTimestamps(dateString) {
  return dateString === null ? null : Math.floor(new Date(dateString).getTime() / 1000);
}

export function optValue(value) {
  if (typeof value === "string") {
    return value ? [value] : [];
  } else if (typeof value === "number") {
    return value ? [value] : [];
  } else if (Array.isArray(value)) {
    return [value.map((item) => optValue(item)[0])];
  } else if (typeof value === "object") {
    return [
      Object.entries(value).reduce((acc, [key, value]) => {
        acc[key] = [value];
        return acc;
      }, {}),
    ];
  }

  return value;
}

export function extractOptValue(optValue, useZeroIndex = true, isArray = false) {
  let value = optValue;

  if (useZeroIndex) value = optValue[0];

  if (typeof value === "string") {
    if (isArray) return value;
    return value[0];
  } else if (typeof value === "number") {
    if (isArray) return value;
    return value[0];
  } else if (Array.isArray(value)) {
    return value.map((item) => extractOptValue(item, false, true));
  } else if (typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, value]) => {
      acc[key] = value[0]; // Ambil nilai pertama dari array
      return acc;
    }, {});
  }

  return value;
}

export function prepareArg(value) {
  if (value === null || value === "" || (Array.isArray(value) && value.length === 0) || Number.isNaN(value) || (typeof value === "object" && Object.keys(value).length === 0)) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "object" ? prepareArg(item) : item));
  }

  if (typeof value === "object") {
    const transformedObject = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, prepareArg(val)]));
    return [transformedObject]; // Pastikan objek tetap dalam array
  }

  return [value]; // Pastikan semua value dikonversi menjadi array
}
