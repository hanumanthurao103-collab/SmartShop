const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  userId,
  action,
  resourceId,
  details
}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      resource: "Product",
      resourceId,
      details
    });

    return true;
  } catch (error) {
    console.error("Audit logging failed:", error.message);
    return false;
  }
};

module.exports = createAuditLog;