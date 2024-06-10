import {
  WIDGET_FOLDER_PATH,
  WidgetFolderStructureInterface,
} from './constants';

export function getWidgetFolderStructure(): WidgetFolderStructureInterface {
  return {
    base: `${WIDGET_FOLDER_PATH}/`,
    src: `${WIDGET_FOLDER_PATH}/src`,
    build: `${WIDGET_FOLDER_PATH}/dist`,
    packageJSON: `${WIDGET_FOLDER_PATH}/package.json`,
    packageXML: `${WIDGET_FOLDER_PATH}/src/package.xml`,
  };
}
