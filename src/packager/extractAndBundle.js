var path = require('path');
var extract = require('./extract');
var resolveEntries = require('./resolveEntries');
var bundle = require('./bundle');
var utils = require('./utils');
var AWS = require('aws-sdk');

var s3 = new AWS.S3();

var defaultCallback = function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
};

function saveFile(fileName, data, callback = defaultCallback) {
  return s3.putObject(
    {
      Body: data,
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      ACL: 'public-read',
    },
    callback
  );
}

function extractAndBundle(absolutePackages, hash) {
  var currentTime = Date.now();
  var packagePath = `/tmp/packages/${hash}`;

  console.log(
    'Started - ' + absolutePackages.join(', ') + ' - ' + new Date(currentTime)
  );

  return extract(absolutePackages, packagePath)
    .then(resolveEntries(absolutePackages, packagePath))
    .then(bundle(packagePath))
    .then(function respond() {
      return Promise.all([
        utils.readFile(path.resolve(packagePath, 'manifest.json')),
        utils.readFile(path.resolve(packagePath, 'dll.js')),
      ]);
    })
    .then(function(files) {
      console.log('Success - ' + utils.getDuration(currentTime) + 's');
      if (process.env.IN_LAMBDA) {
        saveFile(`${hash}/manifest.json`, files[0]);
        saveFile(`${hash}/dll.js`, files[1]);
      }

      return files;
    })
    .catch(function(error) {
      console.log(
        'Error - ' +
          error.message +
          ' - ' +
          utils.getDuration(currentTime) +
          's'
      );
      console.log(error.stack);
      currentTime = Date.now();
      res.status(500).send({ error: error.message });
    });
}
module.exports = extractAndBundle;
