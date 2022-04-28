import * as fs from 'fs';
import { getOctokit, context } from '@actions/github';
import { FOLDERS_WHERE_MENDIX_WIDGETS_ARE, PACKAGES_PATH } from './constants';

import { createRelease, uploadBuildFolderToRelease, getTagName } from './gitUtils';

import {
  _readPackageJSON,
  runBuildCommand,
  _readFileAsync,
  runInstallCommand,
  _readPackageXML,
  _writePackageXML,
} from './filesystemUtils';

import { _widgetFolderStructure, _xmlVersion, _changeXMLVersion } from './utils';

const core = require('@actions/core');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const github = getOctokit(process.env.GITHUB_TOKEN || GITHUB_TOKEN);

async function run() {
  console.log(`Running action on path ${PACKAGES_PATH}`);

  /**
   *  Loop through all packages.
   */
  let packagesToBuild = [];
  // Sees if PackageFolder is Dir
  if (fs.lstatSync(PACKAGES_PATH).isDirectory()) {
    // Reads all folders in /packages
    const packagesFolders = await _readFileAsync(PACKAGES_PATH);

    for (const packageSub of packagesFolders) {
      console.log(`Checking subpath ${packageSub.name}`);

      // check if folder contains Widgets
      if (packageSub.name.includes(FOLDERS_WHERE_MENDIX_WIDGETS_ARE)) {
        const PACKAGE_PATH = `${process.env.GITHUB_WORKSPACE}/${packageSub.name}`;
        console.log(`Subpath ${PACKAGE_PATH} is valid`);
        // Reads all folders in a folder that ends with FOLDERS_WHERE_MENDIX_WIDGETS_ARE
        const packageWidgetFolders = await _readFileAsync(PACKAGE_PATH);
        // Will contain all info to create the release files
        const releaseObjects = [];
        // Loop over all widgets
        console.log('BUILDING WIDGETS');
        for (const packageFolder of packageWidgetFolders) {
          console.log(`Building widget ${packageFolder.name}`);
          // Builds a helper object with all paths that we will need
          const widgetStructure = _widgetFolderStructure(
            packageSub.name,
            packageFolder.name
          );
          // Reads package.json
          const packageJSON = await _readPackageJSON(widgetStructure);
          // Gets version in package.json
          const jsonVersion = packageJSON.version;

          // Push package name to build array
          packagesToBuild.push(widgetStructure);
          // Should not be needed for YARN but this installs all NPM modules from this path
          await runInstallCommand(widgetStructure);
          // Build new version
          await runBuildCommand(widgetStructure);

          releaseObjects.push({ github, widgetStructure, jsonVersion });
        }

        console.log('CREATING RELEASE');
        const tagName = await getTagName(github, context);
        console.log('New tag:', tagName);

        const release = await createRelease(github, context, tagName);

        if (!release) {
          return core.error('No Release Found');
        }

        // Upload all mpk's to release
        console.log(`UPLOADING MPKS`);

        releaseObjects.forEach(
          async (widget) => await uploadBuildFolderToRelease({ ...widget, release })
        );
      }
    }
  }
}

run();
