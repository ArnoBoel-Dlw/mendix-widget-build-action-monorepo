const core = require('@actions/core');

const IDENTIFY_WIDGETS_FOLDERS = core.getInput('identify_widgets_folders') || '-widgets';

const RELEASE_VERSION = core.getInput('release_version');
export interface WidgetFolderStructureInterface {
  base: string;
  build: string;
  src: string;
  packageJSON: string;
  packageXML: string;
}
export interface TriggerCommitsInterface {
  WIDGET: string;
}

export const FOLDERS_WHERE_MENDIX_WIDGETS_ARE = IDENTIFY_WIDGETS_FOLDERS;
export const PACKAGES_PATH = `${process.env.GITHUB_WORKSPACE}`;
export const baseDir = process.env.GITHUB_WORKSPACE;
export const releaseVersion = RELEASE_VERSION;
