const mqtt = require('mqtt');
const Influx = require('influx');
const { json } = require('express');

const CONNECTION_TIME_OUT = 5000;
const setIntervalTime=5000;
const REDIS_URL = 'redis://localhost:6378'
const topic = 'devicesIn/+/data';

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://localhost:1883`;
 //mqtt  client
const mqttClient = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 5000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});
 
mqttClient.on('connect', () => {
    console.log('Connected');
    mqttClient.subscribe([topic], () => {
      console.log(`Subscribe to topic '${topic}'`);
    });
});
   
//influx client
const influxClient = new Influx.InfluxDB({host: 'localhost',database: 'devices',});

const createDatabaseIfNotExists = async () => {
  try {
    const names = await influxClient.getDatabaseNames();
  
    if (!names.includes('devices')) {
      await influxClient.createDatabase("devices");
    }
  } catch (err) {
    console.error('Error creating Influx database!', err);
    throw err; // Re-throw the error to propagate it further 
  }
};
createDatabaseIfNotExists()


//redis client
const asyncRedis = require("async-redis");
const redisClient = asyncRedis.createClient({url: REDIS_URL});
redisClient.on("error", function (err) {
    console.log("Error " + err);
});



// on mqtt message
mqttClient.on('message', async(topic, payload) => {
    const stringPayload = payload.toString();
    const jsonPayload = JSON.parse(stringPayload);

    //redis connection timeout get and set if not present
    let connectionTimeOut;
    connectionTimeOut = await redisClient.HGET(`deviceInfo:connectionTimeOut`,`${jsonPayload.device}`);
    if(!connectionTimeOut){
      await redisClient.HSET(`deviceInfo:connectionTimeOut`,`${jsonPayload.device}`,5000);
      connectionTimeOut = 5000 ;
    }

    //redis lastTimeStamp and activeStatus get and set if not present
    let lastTimeStamp;
    lastTimeStamp = await redisClient.HGET(`deviceInfo:lastTimeStamp`,jsonPayload.device);
    if(!lastTimeStamp){
      await redisClient.HSET(`deviceInfo:lastTimeStamp`,jsonPayload.device, jsonPayload.time);
      lastTimeStamp = jsonPayload.time;
    }

    let activeStatus;
    activeStatus = await redisClient.HGET(`deviceInfo:activeStatus`,jsonPayload.device);
    if(activeStatus!="true" && activeStatus!="false"){
      await redisClient.HSET(`deviceInfo:activeStatus`,jsonPayload.device,"true");
      activeStatus = "true";
    }

    // console.log(connectionTimeOut)
    // console.log(lastTimeStamp)
    // console.log(activeStatus)
    
    //check if device is active and connection timeout is paased , if so then send rssi packet -1
    // console.log(jsonPayload)
    // console.log(activeStatus)
    // console.log( Date.now()   )
    // console.log( lastTimeStamp  )
    // console.log(   connectionTimeOut)
    // console.log(Date.now() - lastTimeStamp)

    if (activeStatus === "true"  && Date.now() - lastTimeStamp > connectionTimeOut){
      const timeOutTimeStamp= Number(lastTimeStamp) + Number(connectionTimeOut)
      const dataPacket = {
        device: jsonPayload.device,
        time: timeOutTimeStamp ,
        data: [{
            tag: 'RSSI',
            value: -1
        }]
      }
      
      mqttClient.publish(`devicesIn/${jsonPayload.device}/timeOut`, JSON.stringify(dataPacket));
      console.log(dataPacket)
      activeStatus = await redisClient.HSET(`deviceInfo:activeStatus`,jsonPayload.device,"false");
      lastTimeStamp = await redisClient.HSET(`deviceInfo:lastTimeStamp`,jsonPayload.device, timeOutTimeStamp);

    }else{
      lastTimeStamp = await redisClient.HSET(`deviceInfo:lastTimeStamp`,jsonPayload.device, jsonPayload.time);
      activeStatus = await redisClient.HSET(`deviceInfo:activeStatus`,jsonPayload.device,"true");
    }


    // await redisClient.HSET(`lastPacketTime:${jsonPayload.device}`, `time`,`${jsonPayload.time}`);
    // const timerId = await redisClient.HGET(`lastPacketTime:${jsonPayload.device}`, `timerId`);
    // console.log("timer id " + timerId)
    // clearTimeout(timerId)
    // timer(jsonPayload.device)
})


setInterval(async () => {
  const  activeStatusHash = await redisClient.HGETALL(`deviceInfo:activeStatus`);
  if(activeStatusHash){
    for (const [device, activeStatus] of Object.entries(activeStatusHash)) {
      // console.log(typeof activeStatus)
      if (activeStatus === "true"){
        const lastTimeStamp = await redisClient.HGET(`deviceInfo:lastTimeStamp`,device);
        const connectionTimeOut = await redisClient.HGET(`deviceInfo:connectionTimeOut`,device);
        if( Date.now() - lastTimeStamp> connectionTimeOut){
            const timeOutTimeStamp= Number(lastTimeStamp) + Number(connectionTimeOut)
            const dataPacket = {
              device: device,
              time: timeOutTimeStamp,
              data: [{
                  tag: 'RSSI',
                  value: -1
              }]
            }
            
            mqttClient.publish(`devicesIn/${device}/timeOut`, JSON.stringify(dataPacket));
            await redisClient.HSET(`deviceInfo:activeStatus`,device,"false");
            await redisClient.HSET(`deviceInfo:lastTimeStamp`,device, timeOutTimeStamp);
          }
        }
      }  
    }
    console.log("timeout run")
}, setIntervalTime);
























// async function timer(device){

//   let timerId = setTimeout(async()=>{
//       console.log("in timer")
//       disconnectTrigger(device)
//     },
//     CONNECTION_TIME_OUT
//   ) 
//   await redisClient.HSET(`lastPacketTime:${device}`, `timerId`,`${timerId}`, `status`, 1);
// }


// async function disconnectTrigger(device){
//   console.log("in disconnectTrigger")
//   const currTime = Date.now()
//   const lastPacketTime = await redisClient.HGET(`lastPacketTime:${device}`, `time`);
//   const diffTime = currTime - lastPacketTime;
  
//   const dataPacket = {
//     device: device,
//     time: currTime ,
//     data: [{
//         tag: 'RSSI',
//         value: -1
//     }]
//   }
  
//   mqttClient.publish(`devicesIn/${device}/timeOut`, JSON.stringify(dataPacket));
//   console.log(dataPacket)

//   await redisClient.HSET(`lastPacketTime:${device}`, `status`, -1 ,`time`, `${currTime}`);
  
// }

