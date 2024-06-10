const core = require('@actions/core');
export interface WidgetFolderStructureInterface {
  base: string;
  build: string;
  src: string;
  packageJSON: string;
  packageXML: string;
}

const IDENTIFY_WIDGET_FOLDER =
  core.getInput('widget-folder');

export const WORKSPACE_PATH = `${process.env.GITHUB_WORKSPACE}`;
export const WIDGET_FOLDER = IDENTIFY_WIDGET_FOLDER;
export const WIDGET_FOLDER_PATH = `${WORKSPACE_PATH}/${WIDGET_FOLDER}`;
