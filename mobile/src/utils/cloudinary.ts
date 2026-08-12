// Pure JS SHA-1 implementation for signing Cloudinary upload requests
function sha1(str: string): string {
  const buffer = new ArrayBuffer(str.length * 2);
  const view = new Uint16Array(buffer);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }

  // SHA-1 helper functions
  const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));

  const cvtHex = (val: number) => {
    let str = "";
    for (let i = 7; i >= 0; i--) {
      const v = (val >>> (i * 4)) & 0xf;
      str += v.toString(16);
    }
    return str;
  };

  const align8 = (s: string) => {
    const nblk = ((s.length + 8) >> 6) + 1;
    const blks = new Array(nblk * 16);
    for (let i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (let i = 0; i < s.length; i++) {
      blks[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
    }
    blks[s.length >> 2] |= 0x80 << (24 - (s.length % 4) * 8);
    blks[nblk * 16 - 1] = s.length * 8;
    return blks;
  };

  const x = align8(str);
  const w = new Array(80);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  let e = -1009589776;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    const olde = e;

    for (let j = 0; j < 80; j++) {
      if (j < 16) w[j] = x[i + j];
      else w[j] = rotateLeft(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);

      let t = 0;
      if (j < 20) {
        t = (b & c) | (~b & d);
        t += 1518500249;
      } else if (j < 40) {
        t = b ^ c ^ d;
        t += 1859775393;
      } else if (j < 60) {
        t = (b & c) | (b & d) | (c & d);
        t += -1894007588;
      } else {
        t = b ^ c ^ d;
        t += -899497514;
      }

      t += rotateLeft(a, 5) + e + w[j];
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = t;
    }

    a += olda;
    b += oldb;
    c += oldc;
    d += oldd;
    e += olde;
  }

  return cvtHex(a) + cvtHex(b) + cvtHex(c) + cvtHex(d) + cvtHex(e);
}

// Credentials corresponding to the backend configuration for consistency
const CLOUDINARY_CLOUD_NAME = "dxlcoceps";
const CLOUDINARY_API_KEY = "886955152273283";
const CLOUDINARY_API_SECRET = "aZb887wRq1biU8aygChZLNi6x7E";
const CLOUDINARY_FOLDER = "justtap/profile-images/customers";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a local image file URI directly to Cloudinary using signed requests.
 */
export async function uploadToCloudinary(fileUri: string): Promise<CloudinaryUploadResponse> {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Create signature parameters in alphabetical order
  const folder = CLOUDINARY_FOLDER;
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = sha1(signatureString);

  // Setup form data for upload
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = fileUri.split("/").pop() || "upload.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("file", {
    uri: fileUri,
    name: filename,
    type,
  } as any);
  
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Cloudinary upload failed");
    }

    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error("Error in Cloudinary direct upload:", error);
    throw error;
  }
}
