import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import * as path from 'path';

const core = require('@actions/core');

import { WidgetFolderStructureInterface } from './constants';

export async function readPackageJSON(
  widgetStructure: WidgetFolderStructureInterface
) {
  const rawPackageJSON = await fs.readFileSync(
    path.resolve(widgetStructure.packageJSON),
    'utf8'
  );
  const parsedPackageJSON = JSON.parse(rawPackageJSON);
  return parsedPackageJSON;
}

export async function runInstallCommand(
  widgetStructure: WidgetFolderStructureInterface
) {
  const { stdout } = await spawnAsync('npm', [
    'install',
    '--prefix',
    widgetStructure.base,
  ]);

  return stdout;
}

export async function runInstallPeerDepsCommand(
  widgetStructure: WidgetFolderStructureInterface
) {
  const { stdout } = await spawnAsync('npm', [
    'install',
    '--legacy-peer-deps',
    '--prefix',
    widgetStructure.base,
  ]);

  return stdout;
}

export async function runBuildCommand(
  widgetStructure: WidgetFolderStructureInterface
) {
  const { stdout } = await spawnAsync('npm', [
    'run',
    'build',
    '--prefix',
    widgetStructure.base,
  ]);

  return stdout;
}

export async function findBuildFiles(folderPath: string) {
  try {
    const filesArray = await fs.readdirSync(
      path.resolve(folderPath),
      'utf8'
    );
    return filesArray;
  } catch (error) {
    core.error(`Error @ findBuildFiles ${error}`);
  }
}
