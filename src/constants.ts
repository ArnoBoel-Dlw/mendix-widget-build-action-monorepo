const core = require('@actions/core');

const IDENTIFY_WIDGETS_FOLDERS =
  core.getInput('identify_widgets_folders') || '-widgets';

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

export const FOLDERS_WHERE_MENDIX_WIDGETS_ARE =
  IDENTIFY_WIDGETS_FOLDERS;
export const PACKAGES_PATH = `${process.env.GITHUB_WORKSPACE}`;
export const baseDir = process.env.GITHUB_WORKSPACE;
export const releaseVersion = RELEASE_VERSION;

// Updates to only build 1 specific widget
const IDENTIFY_WIDGET_FOLDER =
  core.getInput('widget-folder');
const WORKSPACE_PATH = `${process.env.GITHUB_WORKSPACE}`;

export const WIDGET_FOLDER = IDENTIFY_WIDGET_FOLDER;
export const WIDGET_FOLDER_PATH = `${WORKSPACE_PATH}/${WIDGET_FOLDER}`;
