import importlib
import json
from typing import Any

from jupyter_server.base.handlers import APIHandler
from jupyter_server.services.contents.filemanager import FileContentsManager
from jupyter_server.utils import url_path_join
from tornado import web


def retrieve_notebook(notebook_id: str) -> dict[str, Any] | None:
    """Retrieve notebook from database."""
    url = f"http://localhost:8000/notebooks/{notebook_id}"
    if importlib.util.find_spec("requests"):
        import requests

        data = requests.get(url)
        return data.json()
    elif importlib.util.find_spec("pyodide"):
        import pyodide  # type: ignore

        with pyodide.http.open_url(url) as f:
            return json.loads(f.getvalue())  # type: ignore
    return None


class ShareNotebookHandler(APIHandler):
    """Handler for sharing notebooks."""

    @web.authenticated
    def get(self, notebook_id: str):
        try:
            response = retrieve_notebook(notebook_id)
        except Exception as e:
            raise web.HTTPError(500, str(e))

        if response is None:
            raise web.HTTPError(404, f"Notebook {notebook_id} not found")

        if "data" not in response and "data" not in response["data"]:
            raise web.HTTPError(500, "Notebook data is missing")

        contents = FileContentsManager()
        notebook = response["data"]["data"]
        model = contents.new_untitled(type="notebook")
        model["content"] = notebook
        contents.save(model, model["path"])  # type: ignore

        new_path = response["data"]["id"] + ".ipynb"
        contents.rename_file(model["path"], new_path)  # type: ignore
        self.redirect(f"/lab/tree/{new_path}")


def setup_handlers(app: web.Application):
    host_pattern = ".*$"
    base_pattern = url_path_join(app.settings["base_url"], "scrappy-labextension")
    app.add_handlers(
        host_pattern,
        [
            (url_path_join(base_pattern, "notebooks", "([^/]*)/?"), ShareNotebookHandler),
        ],
    )
