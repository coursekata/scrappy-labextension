import { Dialog, ICommandPalette, ToolbarButton, showErrorMessage } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';

import { makeRequestUrl } from './handler';

export class ShareButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(
    private command_name: string,
    private commands: CommandRegistry
  ) {}

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const shareButton = new ToolbarButton({
      label: 'Share notebook',
      onClick: () => this.commands.execute(this.command_name)
    });

    panel.toolbar.insertAfter('cellType', 'share-notebook', shareButton);
    return shareButton;
  }
}

export function makeShareCommand(
  name: string,
  apiUrl: string,
  commands: CommandRegistry,
  palette: ICommandPalette,
  tracker: INotebookTracker
) {
  palette.addItem({ command: name, category: 'Notebook Operations' });

  // TODO: override copy shareable link:
  // https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html#id10
  commands.addCommand(name, {
    label: 'Scrappy: Share notebook',
    execute: async () => {
      // ensure the current widget is a notebook
      if (!tracker.currentWidget) {
        showErrorMessage("Can't share", 'You must have a notebook open to share it.');
        return;
      }

      try {
        // TODO: API should take full notebook model, not just content
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: tracker.currentWidget.context.model.toJSON() })
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) throw new Error('API error');

        // TODO: the link should point to the API running on JupyterLab server, not the API
        const dialog = makeShareDialog(makeRequestUrl(`notebooks/${responseData.data.id}`));
        await dialog.launch();
        dialog.dispose();
      } catch (error) {
        console.error(error);
        showErrorMessage("Can't share", 'There was an error sharing your notebook.');
        return;
      }
    }
  });
}

function makeShareDialog(url: string): Dialog<Widget> {
  const body = new Widget();

  const bodyText = document.createElement('p');
  bodyText.innerText = 'Use this link to share your notebook:';
  body.node.append(bodyText);

  // TODO: would be nice if this was "click to copy"
  const linkText = document.createElement('p');
  linkText.innerText = url;
  body.node.append(linkText);

  const widget = new Dialog<Widget>({
    title: 'Share notebook',
    body: body,
    buttons: [Dialog.okButton({ label: 'Close' })],
    hasClose: true
  });

  return widget;
}
