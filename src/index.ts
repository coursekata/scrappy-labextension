import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';

import { requestAPI } from './handler';
import { ShareButton, makeShareCommand } from './share';

/** Initialization data for the @coursekata/scrappy extension. */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coursekata/scrappy:plugin',
  description: 'The JupyterLab companion extension for Scrappy: the easy way to share Jupyter',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, tracker: INotebookTracker) => {
    console.log('JupyterLab extension @coursekata/scrappy is activated!');

    const { commands, docRegistry } = app;
    const command_name = 'scrappy:share';
    docRegistry.addWidgetExtension('Notebook', new ShareButton(command_name, commands));
    makeShareCommand(command_name, 'http://127.0.0.1:8000/notebooks', commands, palette, tracker);

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
