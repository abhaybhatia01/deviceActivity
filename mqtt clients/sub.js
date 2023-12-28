const mqtt = require('mqtt');
const Influx = require('influx');
const { json } = require('express');
const { dateToTime } = require('influx/lib/src/grammar');

const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'devices',

});

const createDatabaseIfNotExists = async () => {
    try {
      const names = await influx.getDatabaseNames();
    
      if (!names.includes('devices')) {
        await influx.createDatabase("devices");
      }
    } catch (err) {
      console.error('Error creating Influx database!', err);
      throw err; // Re-throw the error to propagate it further 
    }
  };
createDatabaseIfNotExists()

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `mqtt://localhost:1883`;
 
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});
 
const topic = 'devicesIn/#';
 
client.on('connect', () => {
  console.log('Connected');
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`);
  });
});
 

function makeAggregatePublish(){
    let aggregatePublish=[]
    let limit = 1;
    let refresh = 10000;
    let lastPublish =  Date.now();
    let timerId;

    function pushData(publishUnit){
        aggregatePublish.push(publishUnit)
        // timer()
    } 
    function getData(){
        return aggregatePublish
    }    
    function reset(){
        aggregatePublish=[]
        return aggregatePublish.length
    }
    function timer(){
      clearTimeout(timerId)
      // console.log("old timer deleted ")
      timerId =  setTimeout(() => {
        if(aggregatePublish.length > 0){
          writeData()
        }
        console.log("timer executed  at "+ Date.now())
      }, refresh);
      console.log("10s timer started  at " + Date.now())
    }
    //
    return {
        pushData,
        getData,
        reset,
        limit,
        refresh,
        lastPublish,
        timer,
        timerId
    }
}

const aggregatePublish = makeAggregatePublish()

client.on('message', async(topic, payload) => {

    const stringPayload = payload.toString();
    const jsonPayload = JSON.parse(stringPayload);
    for(let index =0; index<jsonPayload.data.length; index++){
      let publishUnit = {
          measurement: jsonPayload.device,
          timestamp:jsonPayload.time,
          tags: { sensor: jsonPayload.data[index].tag },
          fields: { del: 0, value: jsonPayload.data[index].value },
      }
        aggregatePublish.pushData(publishUnit)
      }

    if(aggregatePublish.getData().length >= aggregatePublish.limit ){
      writeData()
    }
});

async function writeData(){
  try{
    await influx.writePoints(aggregatePublish.getData(),{
      precision: 'ms'
    });
    console.log(aggregatePublish.getData())
    console.log(`${aggregatePublish.getData().length} Points written `)
    aggregatePublish.reset();
    // aggregatePublish.timer()
    aggregatePublish.lastPublish = Date.now();
  }catch (err) {
      console.log(err)
      console.error(`Error saving data to InfluxDB! ${err.stack}`);
  }
}

function makeTags(data){
    const obj={}
    for(let i=0; i<data.length; i++) {
        obj[data[i].tag]=data[i].value
    }
    return obj
}

// {
//     measurement: data.device,
//     tags: { sensor: data.data[index].tag },
//     fields: { del: 0, value: data.data[index].value },
//     timestamp
// }




// 1702880471465816804
// 1702880471438
// 1577836800000
// fix the time diff



// 1702884382993
// 1702884295262000000
// 1702888848741