const mqtt = require('mqtt');
// const moment = require('moment');

const devID = 'INEM_DEMO';
const topic = `devicesIn/${devID}/data`;
const max = 100;
const min = 10;
let mqttClient;

function publishData() {
    counter = 1
    let random3 = (Math.random() * (max - min)) + min;
    console.log('Publishing ', devID, ' data...');
    const interval = setInterval(() => {
        /** Publish on mqtt every second */
        const random = (Math.random() * (max - min)) + min;
        const random2 = (Math.random() * (max - min)) + min;
        console.log(counter++)
        let actualTime =Date.now()
        console.log(actualTime)

        const dataPacket = {
            device: devID,
            time: actualTime ,
            data: [
                {
                tag: 'ACTIVE',
                value: random
            },
            {
                tag: 'Energy',
                value: ++random3
            },            
            {
                tag: 'CUR1',
                value: random2
            },
            {
                tag: 'CUR2',
                value: random2
            },
            {
                tag: 'CUR3',
                value: random2
            },
            {
                tag: 'FREQ',
                value: random2
            },
            {
                tag: 'MD',
                value: random2
            },
            {
                tag: 'MDKW',
                value: random2
            },
            {
                tag: 'PF1',
                value: random2
            },
            {
                tag: 'PF2',
                value: random2
            },
            {
                tag: 'PF3',
                value: random2
            },
            {
                tag: 'PFAVG',
                value: random2
            },
            {
                tag: 'REACTIVE',
                value: random2
            },
            {
                tag: 'VOLTS1',
                value: random2
            }, {
                tag: 'VOLTS2',
                value: random2
            }, {
                tag: 'VOLTS3',
                value: random2
            }, {
                tag: 'W1',
                value: random2
            }, {
                tag: 'W2',
                value: random2
            }, {
                tag: 'W3',
                value: random2
            }, {
                tag: 'D18',
                value: random2
            }, {
                tag: 'D19',
                value: random2
            }, {
                tag: 'D20',
                value: random2
            }, {
                tag: 'D21',
                value: random2
            }, {
                tag: 'D22',
                value: random2
            }, {
                tag: 'D23',
                value: random2
            }, {
                tag: 'D24',
                value: random2
            }, {
                tag: 'D25',
                value: random2
            }, {
                tag: 'D26',
                value: random2
            }, {
                tag: 'D27',
                value: random2
            }, {
                tag: 'D28',
                value: random2
            }, {
                tag: 'D29',
                value: random2
            },
            {
                tag: 'D30',
                value: random2
            },
            {
                tag: 'D31',
                value: random2
            },

            {
                tag: 'D32',
                value: random2
            },

            {
                tag: 'D33',
                value: random2
            },

            {
                tag: 'D34',
                value: random2
            },

            {
                tag: 'D35',
                value: random2
            },

            {
                tag: 'D36',
                value: random2
            },
            {
                tag: 'RSSI',
                value: 16 + random
            }
            ]
        };

        mqttClient.publish(topic, JSON.stringify(dataPacket));
    }, 2000);
}
const mqttconfig = {
    host: '127.0.0.1',
    port: 1883,
    username: 'admin',
    password: 'server$4321',
    qos: 2
}
mqttconfig.clientId = 'DMFM_D2' + Date.now();
mqttClient = mqtt.connect(mqttconfig);
console.log('EnergyMeter Mqtt client connected:-', mqttClient.options.clientId);

publishData();