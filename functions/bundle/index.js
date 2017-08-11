const AWS = require('aws-sdk');
const extractAndBundle = require('./extractAndBundle');

const s3 = new AWS.S3();

console.log('starting function');
exports.handle = function(e, ctx, cb) {
  console.log(JSON.stringify(e, null, 2));

  e.Records.forEach(record => {
    if (record.s3) {
      const file = record.s3.object.key;
      console.log('Got request for file ' + file);
      const [hash] = file.split('/');

      s3.getObject(
        {
          Bucket: 'packager.bundles',
          Key: `${hash}/.packages`,
        },
        (err, packagesData) => {
          if (err) {
            console.error(err);
            cb(err);
          }

          s3.getObject(
            {
              Bucket: 'packager.bundles',
              Key: `${hash}/dll.js`,
            },
            (err, data) => {
              if (!data) {
                const packages = packagesData.Body.toString().split('+');

                extractAndBundle(packages, hash)
                  .then(a => {
                    cb(null, 'success');
                  })
                  .catch(e => {
                    s3.deleteObject({
                      Bucket: 'packager.bundles',
                      Key: `${hash}/.packages`,
                    });
                    cb(e);
                  });
              }
            }
          );
        }
      );
    }
  });
};
