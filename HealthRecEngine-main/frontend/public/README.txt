# Frontend Public Directory Documentation

This directory contains static files that are served directly by the web server.

## Directory Contents

- `favicon.ico`: The website favicon displayed in browser tabs and bookmarks.
- Other static assets that don't require processing by the build system.

## Usage Guidelines

1. **Asset Placement**: Only place files here that need to be accessible at a static URL path.

2. **Large Files**: Consider using a CDN for large files rather than including them in the public directory.

3. **Dynamic Assets**: Files that need to be processed or referenced in code should be placed in the assets directory instead.

4. **Path References**: When referencing files from this directory in code, use absolute paths starting with "/".

