import * as fs from 'fs';
import simpleGit from 'simple-git';
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
   *  Loop Through All Packages.
   */
  let packagesToBuild = [];
  // Sees if PackageFolder is Dir
  if (fs.lstatSync(PACKAGES_PATH).isDirectory()) {
    // Reads All Folder in /packages
    const packagesFolders = await _readFileAsync(PACKAGES_PATH);

    for (const packageSub of packagesFolders) {
      console.log(`Checking subpath ${packageSub.name}`);

      // if folder has Widgets in and not utils
      if (packageSub.name.includes(FOLDERS_WHERE_MENDIX_WIDGETS_ARE)) {
        const PACKAGE_PATH = `${process.env.GITHUB_WORKSPACE}/${packageSub.name}`;
        console.log(`Subpath ${PACKAGE_PATH} is valid`);
        // Reads all Folders in a Folder that ends with FOLDERS_WHERE_MENDIX_WIDGETS_ARE
        const packageWidgetFolders = await _readFileAsync(PACKAGE_PATH);
        const releaseObjects = [];
        // Loop Over All Widgets (Now Assume We are in Widgets Folder)
        for (const packageFolder of packageWidgetFolders) {
          console.log(`Checking widget ${packageFolder.name}`);
          // Builds a Helper Object with All the Paths we will need
          const widgetStructure = _widgetFolderStructure(
            packageSub.name,
            packageFolder.name
          );
          // Reads Package.json
          const packageJSON = await _readPackageJSON(widgetStructure);
          // Gets Version in Package.json
          const jsonVersion = packageJSON.version;

          // Build widget           console.log(`Build widget`);
          // Push Package Name To Build Array Keep
          packagesToBuild.push(widgetStructure);
          // Should not be needed for YARN but this installs all NPM modules from this path
          await runInstallCommand(widgetStructure);
          // Build New Version
          await runBuildCommand(widgetStructure);

          releaseObjects.push({ github, widgetStructure, jsonVersion });
        }

        const tagName = await getTagName(github, context);
        console.log(`New tag name: ${tagName}`);
        const release = await createRelease(github, context, tagName);
        if (!release) {
          return core.error('No Release Found');
        }

        // Upload all mpk's to release
        console.log(`Upload all widget files to release`);
        releaseObjects.forEach(
          async (widget) => await uploadBuildFolderToRelease({ ...widget, release })
        );
      }
    }
  }
}

run();
