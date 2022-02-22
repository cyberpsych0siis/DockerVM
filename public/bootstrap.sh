#!/bin/sh
export HOSTNAME = $(cat /etc/hostname) && curl -X POST $CALLBACK_ENDPOINT -d "id=$HOSTNAME" -d "payload=$ENDPOINT_URI"