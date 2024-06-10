import {
  WIDGET_FOLDER,
  WIDGET_FOLDER_PATH,
  WORKSPACE_PATH,
} from './constants';

import {
  findBuildFiles,
  readPackageJSON,
  runBuildCommand,
  runInstallCommand,
  runInstallPeerDepsCommand,
} from './filesystemUtils';

import { getWidgetFolderStructure } from './utils';

const core = require('@actions/core');

async function buildWidget() {
  console.log('******* ACTION INPUTS *******');
  console.log(`Running action on path: ${WORKSPACE_PATH}`);
  console.log(
    `Building widget in folder: ${WIDGET_FOLDER}`
  );
  console.log(
    `Building widget in path: ${WIDGET_FOLDER_PATH}`
  );

  // Builds a helper object with all paths that we will need
  const widgetFolderStructure = getWidgetFolderStructure();
  console.log(
    `Widget folder structure: ${widgetFolderStructure}`
  );
  // Reads package.json
  const packageJSON = await readPackageJSON(
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
  const buildFiles = await findBuildFiles(
    FOLDER_WHERE_RELEASE_IS
  );
  console.log(`Files to release: ${buildFiles}`);

  console.log('TODO: release widget');
}

buildWidget();
