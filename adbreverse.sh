#!/bin/bash
# On Android, need to run adbreverse before accessing the device.
adb reverse tcp:8081 tcp:8081
