#!/bin/bash
set -e

# Install dependencies for the root web client, the api-server, and the
# admin app so the project is runnable after every merge.
npm install --no-audit --no-fund
( cd api-server && npm install --no-audit --no-fund )
( cd everclean-admin && npm install --no-audit --no-fund )
