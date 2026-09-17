#!/usr/bin/env bash
set -e

# Ensure /tmp/gai.conf exists with IPv4 precedence
if [ ! -f /tmp/gai.conf ] || ! grep -q "precedence ::ffff:0:0/96 100" /tmp/gai.conf; then
  echo "precedence ::ffff:0:0/96 100" > /tmp/gai.conf
fi

# Run command inside bwrap if available and not already inside bwrap
if command -v bwrap >/dev/null 2>&1 && [ -z "$IN_BWRAP" ]; then
  export IN_BWRAP=1
  exec bwrap --dev-bind / / --ro-bind /tmp/gai.conf /etc/gai.conf "$@"
else
  exec "$@"
fi
