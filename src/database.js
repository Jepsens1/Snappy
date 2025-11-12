const mongoose = require('mongoose');

module.exports = {
	async connect() {
		try {
			await mongoose.connect(process.env.MONGODB_URI, {
				serverApi: {
					version: '1',
					strict: true,
					deprecationErrors: true,
				},
			});
			console.log('Connected to MongoDB!');
		} catch (error) {
			console.error('Error connecting MongoDB', error);
		}
	},
};
