var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

var mongodbUrl = process.env.NODE_ENV == 'test' ? process.env.MONGODB_TEST_URI : process.env.MONGODB_URI;

mongoose.connect(mongodbUrl, {
  useMongoClient: true
});

module.exports = mongoose;