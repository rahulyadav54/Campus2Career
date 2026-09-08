import crypto from "crypto";

export const generateCertificateId = () => `C2C-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
