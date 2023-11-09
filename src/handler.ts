import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

/**
 * Make a URL for a request to the API extension.
 *
 * @param endpoint API end point to call (plus any params)
 * @param settings The server settings
 * @returns A URL string.
 */
export function makeRequestUrl(endpoint: string, settings?: ServerConnection.ISettings): string {
  settings = settings ?? ServerConnection.makeSettings();
  return URLExt.join(settings.baseUrl, 'scrappy-labextension', endpoint);
}

/**
 * Call the API extension.
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(endPoint = '', init: RequestInit = {}): Promise<T> {
  const settings = ServerConnection.makeSettings();
  const requestUrl = makeRequestUrl(endPoint, settings);
  console.log({ requestUrl }); // TODO: remove
  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as any);
  }

  let data: any = await response.text();
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}
