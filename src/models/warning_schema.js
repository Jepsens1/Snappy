const { model, Schema } = require('mongoose');

const warningSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},
	guildId: {
		type: String,
		required: true,
	},
	reason: {
		type: String,
		required: true,
	},
	active: {
		type: Boolean,
	},
	expiresInSeconds: {
		type: Number,
		required: true,
	},
});

module.exports = model('Warning', warningSchema);
