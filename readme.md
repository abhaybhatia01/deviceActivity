# tracking device activity using emqx, mqtt, influxdb and redis.

##  sure your emqx service is running on the port localhost:1883
## make sure your redis service is running on the port localhost:6378
## make sure you have influx installed on the default port 

## how to use
1 run publisher.js in the mqtt clients folder:
    node publisher.js

2 run sub.js in the mqtt clients folder:
    node sub.js

3 run deviceActivity.js in the mqtt clients folder:
    node deviceActivity.js
