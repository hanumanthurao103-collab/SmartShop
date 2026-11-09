const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "PRODUCT_DELETED"
      ]
    },
    resource: {
      type: String,
      required: true,
      default: "Product"
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    details: {
      type: String,
      maxlength: 200
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);