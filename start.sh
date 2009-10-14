#!/bin/sh

( cd strophejs && make && cp strophe.js ../www/ ) && \
nginx -c nginx.conf -p `pwd`/
