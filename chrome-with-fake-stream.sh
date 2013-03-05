#!/bin/bash

exec "/usr/bin/google-chrome" \
--user-data-dir="/tmp/testacular" \
--disable-extensions \
--no-default-browser-check \
--no-first-run \
--disable-default-apps \
--use-fake-device-for-media-stream \
"$@"
