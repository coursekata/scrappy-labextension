import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the @coursekata/scrappy extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coursekata/scrappy:plugin',
  description: 'The JupyterLab companion extension for Scrappy: the easy way to share Jupyter',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension @coursekata/scrappy is activated!');

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The scrappy_labextension server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
