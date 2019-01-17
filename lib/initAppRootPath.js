'use strict';

// This solution doesnt work because package.json in lerna for example is not the same as the root package.json
// const path = require('path');
// const findUp = require('find-up');
//
// const appRootPackage = findUp.sync('package.json');
// if (!appRootPackage) throw new Error('package.json could not be found');
// process.env.APP_ROOT_PATH = path.dirname(appRootPackage);

// lint-file should be run on the same directory than .git
process.env.APP_ROOT_PATH = process.cwd();
