"""Swagger UI + OpenAPI 规范（同源 /api/docs，规范 /api/v1/openapi.json）。"""

from app.openapi_spec import build_openapi_spec
from flask import Blueprint, Response, jsonify

bp = Blueprint("docs", __name__)

_SWAGGER_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>IRA Workshop API · Swagger</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css" crossorigin="anonymous"/>
  <style>body{margin:0;} .swagger-ui .topbar{display:none;}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin="anonymous"></script>
<script>
window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "/api/v1/openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: "BaseLayout",
    docExpansion: "list",
    filter: true,
    tryItOutEnabled: true
  });
};
</script>
</body>
</html>
"""


@bp.route("/docs")
def swagger_ui():
    return Response(_SWAGGER_HTML, mimetype="text/html; charset=utf-8")


@bp.route("/v1/openapi.json")
def openapi_json():
    return jsonify(build_openapi_spec())
