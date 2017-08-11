var path = require('path');
var exec = require('child_process').exec;

module.exports = function (packages, packagePath) {
  return new Promise(function (resolve, reject) {
    exec(`mkdir -p ${packagePath} && cd ${packagePath} && HOME=/tmp ${path.join(__dirname, '../node_modules', '.bin', 'yarn')} add ${packages.join(' ')} --cache-folder=/tmp --no-lockfile --ignore-scripts --non-interactive --no-bin-links --no-lockfile --ignore-engines`, function (err, stdout, stderr) {
      if (err) {
        reject(err.message.indexOf('versions') >= 0 ? new Error('INVALID_VERSION') : err);
      } else {
        resolve();
      }
    });
  })
}
