#!/bin/bash
# create and name a new mode: "1366x768-0"
xrandr --newmode "1366x768-0" 75.61  1366 1406 1438 1574  768 771 777 800 -hsync -vsync

# attach the new mode to an output (VGA1)
xrandr --addmode HDMI-2 "1366x768-0"

# turn on the output using the new mode
xrandr --output HDMI-2 --mode "1366x768-0"
#export DISPLAY=:1
#Xvfb $DISPLAY -screen 0 1366x768x16 & -nocursor
#/home/revel/gst-rtsp-server/examples/test-launch "( ximagesrc show-pointer=0 use-damage=0 ! videoconvert ! videoscale method=0 ! video/x-raw,framerate=30/1,format=(string)I420,width=1366,height=768 ! x264enc ! video/x-h264,profile=(string)main ! rtph264pay name=pay0 pt=96 )" &
#/home/revel/gst-rtsp-server/examples/test-launch "( ximagesrc use-damage=0 ! videoconvert ! videoscale method=0 ! video/x-raw,framerate=30/1,format=(string)I420,width=1920,height=1080 ! vaapih264enc ! video/x-h264,profile=(string)main ! rtph264pay name=pay0 pt=96 )" &
/home/revel/gst-rtsp-server/examples/test-launch "( ximagesrc use-damage=0 ! videoconvert ! videoscale method=0 ! video/x-raw,framerate=30/1,format=(string)I420,width=1366,height=768 ! vaapih264enc ! video/x-h264,profile=(string)main ! rtph264pay name=pay0 pt=96 )" &
sleep 4
(cd /home/revel/electron/ && npm start)




