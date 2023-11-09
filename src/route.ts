import { JupyterFrontEnd, IRouter } from '@jupyterlab/application';
import { URLExt, PageConfig } from '@jupyterlab/coreutils';

export function registerRouteCommand(
  command: string,
  urlPattern: RegExp,
  paramName: string,
  app: JupyterFrontEnd,
  router: IRouter
) {
  const { commands } = app;
  commands.addCommand(command, {
    execute: (args: any) => {
      const { request, search } = args as IRouter.ILocation;
      const matches = request.match(urlPattern) ?? [];
      if (!matches) return;

      const urlParams = new URLSearchParams(search);
      const paths = urlParams.getAll(paramName);
      if (!paths) return;

      const urls = paths.map(path => decodeURIComponent(path));
      app.restored.then(() => {
        urls.forEach(async id =>
          commands.execute('scrappy:load', { id }).then(panel => panel.activate())
        );

        // remove the query param from the URL
        const url = new URL(URLExt.join(PageConfig.getBaseUrl(), request));
        url.searchParams.delete(paramName);
        const { pathname, search } = url;
        router.navigate(`${pathname}${search}`, { skipRouting: true });
      });
    }
  });
}
