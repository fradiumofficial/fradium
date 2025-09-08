/**
 * Pinata IPFS Service
 * Handles file uploads to IPFS via Pinata API
 */

/**
 * Upload a single file to Pinata IPFS
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The IPFS hash (CID) of the uploaded file
 */
export const uploadFileToPinata = async (file) => {
  try {
    const pinataToken = import.meta.env.VITE_PINATA_JWT_TOKEN;

    if (!pinataToken) {
      throw new Error("Pinata JWT token not configured. Please set VITE_PINATA_JWT_TOKEN in your .env file.");
    }

    const formData = new FormData();
    formData.append("file", file);

    // Add metadata with group "fradium"
    const metadata = JSON.stringify({
      name: file.name,
      group: "fradium",
    });
    formData.append("pinataMetadata", metadata);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash;
    return `https://gateway.pinata.cloud/ipfs/${cid}`; // Return the full Pinata URL
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};

/**
 * Upload multiple files to Pinata IPFS
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<string[]>} - Array of full Pinata URLs of the uploaded files
 */
export const uploadMultipleFilesToPinata = async (files) => {
  const urls = [];

  for (const file of files) {
    try {
      const url = await uploadFileToPinata(file);
      urls.push(url);
      console.log(`File ${file.name} uploaded with URL: ${url}`);
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw error; // Re-throw to let caller handle
    }
  }

  return urls;
};

/**
 * Upload multiple files to Pinata IPFS with error handling
 * Continues uploading other files even if some fail
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<{success: string[], failed: string[]}>} - Object with successful and failed uploads
 */
export const uploadMultipleFilesToPinataWithFallback = async (files) => {
  const result = {
    success: [],
    failed: [],
  };

  for (const file of files) {
    try {
      const url = await uploadFileToPinata(file);
      result.success.push(url);
      console.log(`File ${file.name} uploaded with URL: ${url}`);
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      result.failed.push(file.name);
    }
  }

  return result;
};

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - The IPFS CID
 * @param {string} gateway - IPFS gateway (default: ipfs.io)
 * @returns {string} - The gateway URL
 */
export const getIpfsUrl = (cid, gateway = "https://ipfs.io/ipfs/") => {
  return `${gateway}${cid}`;
};

/**
 * Validate if a string is a valid IPFS CID
 * @param {string} cid - The string to validate
 * @returns {boolean} - True if valid CID
 */
export const isValidCid = (cid) => {
  // Basic CID validation (starts with Qm for CIDv0 or bafy for CIDv1)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^bafy[a-z2-7]{55}$/.test(cid);
};
