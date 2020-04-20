#!/bin/bash

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/kbell/node_subscriber

pid=`ps -ef | grep "index.js" | grep -v 'grep' | awk '{print $2}'`

if [ -z $pid ]; then


   #timezone set
   TZ='Asia/Seoul'; export TZ
   #TZ='UTC'; export TZ

   node /home/kbell/node_subscriber/index.js 2>&1 >> /home/kbell/node_subscriber/index.log &

   echo ""

fi
