const crypto = require("node:crypto");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const bankDetailsRepository = require("../repositories/bank-details.repository");
const logger = require("./logger.service");

const ENCRYPTION_ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(env.BANK_ENCRYPTION_SECRET)
  .digest();

const encrypt = (value) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

const decrypt = (value) => {
  const [ivHex, encryptedHex] = String(value).split(":");
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

const maskAccountNumber = (accountNumber) => {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  return `${"*".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
};

class BankDetailsService {
  serialize(bankDetails) {
    const accountNumber = decrypt(bankDetails.encryptedAccountNumber);

    return {
      id: bankDetails._id,
      providerId: bankDetails.providerId,
      accountHolderName: bankDetails.accountHolderName,
      accountNumberMasked: maskAccountNumber(accountNumber),
      ifscCode: bankDetails.ifscCode,
      bankName: bankDetails.bankName,
      accountType: bankDetails.accountType,
      verified: bankDetails.verified,
      verifiedAt: bankDetails.verifiedAt,
      createdAt: bankDetails.createdAt,
      updatedAt: bankDetails.updatedAt,
    };
  }

  async addBankDetails(providerId, data) {
    if (await bankDetailsRepository.exists(providerId)) {
      throw new ApiError(409, "Bank details already exist for this provider");
    }

    const bankDetails = await bankDetailsRepository.create({
      providerId,
      accountHolderName: data.accountHolderName,
      encryptedAccountNumber: encrypt(data.accountNumber),
      ifscCode: data.ifscCode,
      bankName: data.bankName,
      accountType: data.accountType,
    });

    logger.info("PROVIDER_BANK_DETAILS_CREATED", { providerId });

    return {
      message: "Bank details added successfully",
      data: this.serialize(bankDetails),
    };
  }

  async getBankDetails(providerId) {
    const bankDetails = await bankDetailsRepository.findByProviderId(providerId);
    if (!bankDetails) {
      throw new ApiError(404, "Bank details not found");
    }

    return this.serialize(bankDetails);
  }

  async updateBankDetails(providerId, data) {
    const updateData = { ...data };
    if (updateData.accountNumber) {
      updateData.encryptedAccountNumber = encrypt(updateData.accountNumber);
      delete updateData.accountNumber;
    }

    const bankDetails = await bankDetailsRepository.update(providerId, updateData);
    if (!bankDetails) {
      throw new ApiError(404, "Bank details not found");
    }

    logger.info("PROVIDER_BANK_DETAILS_UPDATED", { providerId });

    return {
      message: "Bank details updated successfully",
      data: this.serialize(bankDetails),
    };
  }

  async deleteBankDetails(providerId) {
    const result = await bankDetailsRepository.delete(providerId);
    if (!result.deletedCount) {
      throw new ApiError(404, "Bank details not found");
    }

    logger.info("PROVIDER_BANK_DETAILS_DELETED", { providerId });

    return { message: "Bank details deleted successfully" };
  }
}

module.exports = new BankDetailsService();
