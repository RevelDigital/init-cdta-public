[Unit]
Description=Revel Service
After=network.target

[Service]
Type=simple
# Another Type option: forking
User=revel
WorkingDirectory=/home/revel
ExecStart=/home/revel/init-cdta-public/startScript.sh
Restart=on-failure
# Other Restart options: or always, on-abort, etc

[Install]
WantedBy=multi-user.target
