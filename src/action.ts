import * as fs from 'fs';
import simpleGit from 'simple-git';
import { getOctokit, context } from '@actions/github';
import { FOLDERS_WHERE_MENDIX_WIDGETS_ARE, PACKAGES_PATH, baseDir } from './constants';

import {
  setGITCred,
  createRelease,
  commitGitChanges,
  uploadBuildFolderToRelease,
} from './gitUtils';

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
const git = simpleGit({ baseDir });

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
        console.log('Start widget loop');
        // Reads all Folders in a Folder that ends with FOLDERS_WHERE_MENDIX_WIDGETS_ARE
        const packageWidgetFolders = await _readFileAsync(PACKAGE_PATH);
        // Loop Over All Widgets (Now Assume We are in Widgets Folder)
        for (const packageFolder of packageWidgetFolders) {
          // Builds a Helper Object with All the Paths we will need
          const widgetStructure = _widgetFolderStructure(
            packageSub.name,
            packageFolder.name
          );
          // Reads Package.json
          const packageJSON = await _readPackageJSON(widgetStructure);
          // Gets Version in Package.json
          const jsonVersion = packageJSON.version;
          // Gets Name in Package.json
          const packagePackageName = packageJSON.name;
          // Reads package.xml
          const packageXML = await _readPackageXML(widgetStructure);
          // Parses .xml and and Returns package.xml Version
          const xmlVersion = _xmlVersion(packageXML);
          console.log(`Working with widget: ${packagePackageName}`);

          console.log(`Versions of widget:`);
          console.log(`Json version: ${jsonVersion}`);
          console.log(`Xml version: ${xmlVersion}`);
          // Checks if Json Version and xml matches.
          if (xmlVersion !== jsonVersion) {
            console.log(`Version changed, creating release for ${packagePackageName}`);
            // Inits Git
            await git.init();
            // Set Git Credentials
            await setGITCred(git);
            // Update XML to match Package.json and
            // const newRawPackageXML = await _changeXMLVersion(packageXML, jsonVersion);
            //  converts Js back to xml and writes xml file to disk
            // await _writePackageXML(widgetStructure, newRawPackageXML);
            // Push Package Name To Build Array Keep
            packagesToBuild.push(widgetStructure);
            // Should not be needed for YARN but this installs all NPM modules from this path
            await runInstallCommand(widgetStructure);
            // Build New Version
            await runBuildCommand(widgetStructure);
            // Tag Name Lerna Created
            const tagName = `${packagePackageName}@${jsonVersion}`;
            // Commit and Push Code
            // await commitGitChanges(git);
            // Changes Tag to Release
            const release = await createRelease(github, context, tagName);
            if (!release) {
              return core.error('No Release Found');
            }
            // Folder name where Widget is Build
            const upload = await uploadBuildFolderToRelease(
              github,
              widgetStructure,
              jsonVersion,
              release
            );
            return upload;
          }
        }
      }
    }
  }
}

run();
