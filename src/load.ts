import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette, InputDialog, showErrorMessage } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';

export function registerLoadCommand(
  name: string,
  apiUrl: string,
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  tracker: INotebookTracker
) {
  const { commands } = app;
  palette.addItem({ command: name, category: 'Notebook Operations' });
  commands.addCommand(name, {
    label: 'Scrappy: Load notebook',
    execute: async args => {
      try {
        const notebookId = normalizeNotebookId(args.id as string) || (await askForNotebookId());
        const notebookJson = await retrieveNotebook(`${apiUrl}/${notebookId}`);
        return makeNotebook(commands, tracker, notebookJson);
      } catch (error) {
        console.error(error);
        showErrorMessage("Can't load", 'There was an error loading the notebook.');
        return;
      }
    }
  });
}

interface NotebookResponse {
  success: boolean;
  message?: string;
  data?: NotebookContentModel;
}

interface NotebookContentModel {
  id: string;
  data: NotebookJson;
}

type NotebookJson = Record<string, any>;

async function makeNotebook(
  commands: CommandRegistry,
  tracker: INotebookTracker,
  notebook: NotebookContentModel
) {
  const notebookPanel: NotebookPanel = await commands.execute('notebook:create-new', {
    kernelName:
      notebook.data.metadata?.kernelspec?.name ??
      tracker.currentWidget?.context.sessionContext.kernelDisplayName
  });
  await notebookPanel.context.ready;
  await notebookPanel.context.rename(`${notebook.id}.ipynb`);
  notebookPanel.context.model.fromJSON(notebook.data);
  return notebookPanel;
}

async function askForNotebookId(): Promise<string> {
  const possibleUrl = await InputDialog.getText({
    title: 'Load notebook',
    placeholder: 'Enter a link to load a notebook:',
    okLabel: 'Load'
  });

  if (!possibleUrl.value || possibleUrl.value.length === 0) {
    throw new Error('No URL or notebook ID provided');
  }

  return normalizeNotebookId(possibleUrl.value);
}

async function retrieveNotebook(url: string): Promise<NotebookContentModel> {
  const apiResponse = await fetch(url);
  if (!apiResponse.ok) {
    throw new Error('Unable to load notebook');
  }

  const responseJson = (await apiResponse.json()) as NotebookResponse;
  if (!responseJson.success) {
    throw new Error(responseJson.message ?? 'Unable to load notebook');
  }

  if (!responseJson.data?.data) {
    throw new Error('Notebook data not found');
  }

  return responseJson.data;
}

function normalizeNotebookId(notebookIdOrUrl: string): string {
  // trim right slash and get last part of URL
  const notebookId = notebookIdOrUrl.replace(/\/$/, '').split('/').pop();
  if (notebookId) return notebookId;
  throw new Error('Unable to determine notebook ID');
}
