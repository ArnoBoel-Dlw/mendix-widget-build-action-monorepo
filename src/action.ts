import { context } from '@actions/github';
import * as fs from 'fs';
import {
  FOLDERS_WHERE_MENDIX_WIDGETS_ARE,
  PACKAGES_PATH,
  WIDGET_FOLDER,
  WIDGET_FOLDER_PATH,
} from './constants';

import {
  createRelease,
  getTagName,
  uploadBuildFolderToRelease,
} from './gitUtils';

import {
  _readFileAsync,
  _readPackageJSON,
  findBuildFiles,
  runBuildCommand,
  runInstallCommand,
  runInstallPeerDepsCommand,
} from './filesystemUtils';

import {
  _widgetFolderStructure,
  getWidgetFolderStructure,
} from './utils';

const core = require('@actions/core');

// const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
// const github = getOctokit(
//   process.env.GITHUB_TOKEN || GITHUB_TOKEN
// );

// TODO
// 1. Get the folder for the widget to build as action input
// 2. Build that specific widget
// 3. Publish it to sharepoint

async function buildWidget() {
  console.log('******* ACTION INPUTS *******');
  console.log(`Running action on path ${PACKAGES_PATH}`);
  console.log(
    `Building widget in folder ${{ WIDGET_FOLDER }}`
  );
  console.log(
    `Building widget in path ${{ WIDGET_FOLDER_PATH }}`
  );

  // Builds a helper object with all paths that we will need
  const widgetFolderStructure = getWidgetFolderStructure();
  console.log(
    `Widget folder structure: ${widgetFolderStructure}`
  );
  // Reads package.json
  const packageJSON = await _readPackageJSON(
    widgetFolderStructure
  );
  // Gets version in package.json
  const jsonVersion = packageJSON.version;
  console.log(`Version in package.json: ${jsonVersion}`);

  console.log('******* INSTALLING PACKAGES *******');
  // Install packages
  try {
    await runInstallCommand(widgetFolderStructure);
  } catch (error) {
    try {
      runInstallPeerDepsCommand(widgetFolderStructure);
    } catch (error) {
      core.error('Error installing packages', error);
      return core.setFailed(error);
    }
  }

  console.log('******* BUILDING WIDGET *******');
  // Build new version
  try {
    await runBuildCommand(widgetFolderStructure);
  } catch (error) {
    core.error('Error building widget', error);
    return core.setFailed(error);
  }

  console.log('******* RELEASE WIDGET *******');
  // Release package (in our case this will be a deploy to sharepoint)
  const FOLDER_WHERE_RELEASE_IS = `${widgetFolderStructure.build}/${jsonVersion}`;
  const filesArray = await findBuildFiles(
    FOLDER_WHERE_RELEASE_IS
  );
  console.log(`Files to release: ${filesArray}`);

  console.log('TODO: release widget');
}

async function run() {
  console.log(`Running action on path ${PACKAGES_PATH}`);

  /**
   *  Loop through all packages.
   */
  let packagesToBuild = [];
  // Sees if PackageFolder is Dir
  if (fs.lstatSync(PACKAGES_PATH).isDirectory()) {
    // Reads all folders in /packages
    const packagesFolders = await _readFileAsync(
      PACKAGES_PATH
    );

    for (const packageSub of packagesFolders) {
      console.log(`Checking subpath ${packageSub.name}`);

      // check if folder contains Widgets
      if (
        packageSub.name.includes(
          FOLDERS_WHERE_MENDIX_WIDGETS_ARE
        )
      ) {
        const PACKAGE_PATH = `${process.env.GITHUB_WORKSPACE}/${packageSub.name}`;
        console.log(`Subpath ${PACKAGE_PATH} is valid`);
        // Reads all folders in a folder that ends with FOLDERS_WHERE_MENDIX_WIDGETS_ARE
        const packageWidgetFolders = await _readFileAsync(
          PACKAGE_PATH
        );
        // Will contain all info to create the release files
        const releaseObjects = [];
        // Loop over all widgets
        console.log('BUILDING WIDGETS');
        for (const packageFolder of packageWidgetFolders) {
          console.log(
            `Building widget ${packageFolder.name}`
          );
          // Builds a helper object with all paths that we will need
          const widgetStructure = _widgetFolderStructure(
            packageSub.name,
            packageFolder.name
          );
          // Reads package.json
          const packageJSON = await _readPackageJSON(
            widgetStructure
          );
          // Gets version in package.json
          const jsonVersion = packageJSON.version;

          // Push package name to build array
          packagesToBuild.push(widgetStructure);

          // Install packages
          try {
            await runInstallCommand(widgetStructure);
          } catch (error) {
            try {
              runInstallPeerDepsCommand(widgetStructure);
            } catch (error) {
              core.error(
                'Error installing packages',
                error
              );
              return core.setFailed(error);
            }
          }

          // Build new version
          try {
            await runBuildCommand(widgetStructure);
          } catch (error) {
            core.error('Error building widget', error);
            return core.setFailed(error);
          }

          releaseObjects.push({
            github,
            widgetStructure,
            jsonVersion,
          });
        }

        console.log('CREATING RELEASE');
        const tagName = await getTagName(github, context);
        console.log('New tag:', tagName);

        const release = await createRelease(
          github,
          context,
          tagName
        );

        if (!release) {
          return core.error('No Release Found');
        }

        // Upload all mpk's to release
        console.log(`UPLOADING MPKS`);

        releaseObjects.forEach(
          async (widget) =>
            await uploadBuildFolderToRelease({
              ...widget,
              release,
            })
        );
      }
    }
  }
}

// run();

buildWidget();
