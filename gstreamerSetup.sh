#!/bin/bash
cd ~
sudo apt update
sudo apt-get --assume-yes install git
git clone https://github.com/RevelDigital/gst-plugins-ugly.git
git clone https://github.com/RevelDigital/gstreamer.git
git clone https://github.com/RevelDigital/gst-rtsp-server.git
git clone https://github.com/RevelDigital/gst-plugins-base.git
git clone https://github.com/RevelDigital/gst-plugins-good.git
git clone https://github.com/RevelDigital/gst-plugins-bad.git
git clone https://github.com/RevelDigital/gst-plugins-ugly.git
git clone https://github.com/RevelDigital/gstreamer-vaapi.git
sudo apt-get --assume-yes install libtool autoconf pkg-config autopoint bison flex libx264-dev gtk-doc-tools libperl-dev libgtk2.0-dev libgles2-mesa-dev nodejs unclutter chromium-browser
sudo ldconfig
echo "setting up gstreamer"
cd gstreamer/
./autogen.sh
make
sudo make install
sudo ldconfig
cd ~
echo "setting up gstreamer"
cd ~/gst-plugins-base/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "setting up gstreamer-plugin-good"
cd ~/gst-plugins-good/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "setting up gstreamer-plugin-bad"
cd ~/gst-plugins-bad/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "setting up gstreamer-plugin-ugly"
cd ~/gst-plugins-ugly/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "setting up rtsp server"
cd ~/gst-rtsp-server/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "gstreamer setup complete"
cd ~/gstreamer-vaapi/
sudo ./autogen.sh
make
sudo make install
cd ~
echo "vaapi setup complete"
cd init-cdta-public/
sudo chmod +x startScript.sh
sudo mv init-revel-startup.service /etc/systemd/system/init-revel-startup.service
sudo systemctl enable init-revel-startup.service
sudo systemctl start init-revel-startup.service
cd ~
echo "Revel Service Installed"
