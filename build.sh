#!/usr/bin/env bash
set -o errexit

scripts/setup-render-ssh.sh
npm install
npm run build
