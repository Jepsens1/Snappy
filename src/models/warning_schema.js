const { model, Schema } = require('mongoose');

const warningSchema = new Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		guildId: {
			type: String,
			required: true,
		},
		issuedBy: {
			type: String,
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

// Activate TTL, to delete warnings that are expired
warningSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = model('Warning', warningSchema);
