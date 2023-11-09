import { IRouter, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';

import { ShareButton, registerShareCommand } from './share';
import { registerLoadCommand } from './load';
import { registerRouteCommand } from './route';

export enum CommandName {
  share = 'scrappy:share',
  load = 'scrappy:load',
  route = 'scrappy:route'
}

/** Initialization data for the @coursekata/scrappy extension. */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coursekata/scrappy:plugin',
  description: 'The JupyterLab companion extension for Scrappy: the easy way to share Jupyter',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker, IRouter],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    tracker: INotebookTracker,
    router: IRouter
  ) => {
    console.log('JupyterLab extension @coursekata/scrappy is activated!');

    const { commands, docRegistry } = app;
    const paramName = 'scrappyId';
    const apiUrl = 'http://127.0.0.1:8000/notebooks';

    // sharing
    registerShareCommand(CommandName.share, apiUrl, paramName, app, palette, tracker);
    docRegistry.addWidgetExtension('Notebook', new ShareButton(CommandName.share, commands));

    // loading
    registerLoadCommand(CommandName.load, apiUrl, app, palette, tracker);

    // routing (autoloading)
    const urlPattern = new RegExp('/lab/?');
    registerRouteCommand(CommandName.route, urlPattern, paramName, app, router);
    router.register({ command: CommandName.route, pattern: urlPattern });
  }
};

export default plugin;
