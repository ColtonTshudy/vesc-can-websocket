// Socket for vesc-dash (Spoofer)

const frequency = 100; //ms between data emits
const increment = 6; //data increment step

const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })
const config = require('./config.json')
const fs = require('fs')

// Initial capacity of the battery as read from the historical data logs
let capacityStamp = 0

let flags = {
    "first_read": 1,
    "check_charged": 1
}

// Data struct
let data = {
    'erpm': 0,
    'rpm': 0,
    'motor_current': 0,
    'duty_cycle': 0,
    'ah_consumed': 0,
    'ah_regen': 0,
    'wh_consumed': 0,
    'wh_regen': 0,
    'mos_temp': 0,
    'mot_temp': 0,
    'battery_current': 0,
    'pid_position': 0,
    'tachometer': 0,
    'battery_voltage': 0,
    'ids': '',
    'mph': 0,
    'odometer': 0,
    'motor_voltage': 0,
    'avg_mph': 0,
    'max_mph': 0,
    'avg_power': 0,
    'max_power': 0,
    'total_msgs': 1,
    'used_ah': 0
}

// Socket connect
io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
    let intervalID

    // Socket subscribes to CAN updates
    socket.on('subscribeToCAN', () => {
        console.log(`${socket.id} connected to can`)
        socket.emit('config', config)
        intervalID = setInterval(canHandler, frequency, socket)
        saveDataInterval = setInterval(saveData, 1000)
    })

    // Client requests battery capacity reset
    socket.on('resetBatteryCapacity', () => {
        capacityStamp = 0;
        console.log('test')
    })

    // Socket disconnect
    socket.on('disconnect', (reason) => {
        console.log(`${socket.id} disconnected (${reason})`)
        clearInterval(intervalID)
    })
})

let i = 0;

// Save data
function saveData() {
    try {
        if (flags.first_read) {
            fs.readFile('ah_consumed.txt', (err, buf) => {
                try {
                    capacityStamp = parseFloat(buf.toString())
                }
                catch { }
                flags.first_read = 0
            })
        }
        else if (flags.check_charged === 1) {
            if (data.battery_voltage > config.battery.max_voltage - 0.5) {
                capacityStamp = 0
            }
            flags.check_charged = 2
        }
        else {
            data.used_ah = capacityStamp + data.ah_consumed - data.ah_regen
            fs.writeFile('ah_consumed.txt', `${data.used_ah}`, (err) => {
            })
        }
    }
    catch {
        capacityStamp = 0
        flags.first_read = 0
    }
}


// CAN message handler
function canHandler(socket) {
    data["total_msgs"] = data["total_msgs"] + 1
    data["erpm"] = (i * 100 % 40000) - 10000
    data["rpm"] = ((i * 100 % 40000) - 10000) / config['motor']['poles']
    data["motor_current"] = i % 300 - 150
    data["duty_cycle"] = i / 100 % 2 - 1
    data["ah_consumed"] = i / 500 % 16
    data["ah_regen"] = i / 2000 % 16
    data["wh_consumed"] = i / 2 % 800
    data["wh_regen"] = i / 50 % 800
    data["mos_temp"] = (i / 5 + 30) % 80
    data["mot_temp"] = (i / 5 + 20) % 80
    data["battery_current"] = i % 160 - 80
    data["pid_position"] = i % 50000
    data["tachometer"] = (i * 100 % 1000000) / config['motor']['poles']
    data["battery_voltage"] = 58 - (i / 20) % (58 - 40)
    data["ids"] = [14, 15, 16, 0, 27]
    data["mph"] = mph(((i * 200 % 60000) - 30000) / config['motor']['poles'])
    data["odometer"] = miles((i * 100 % 1000000) / config['motor']['poles'])
    data["motor_voltage"] = i / 2 % 58
    data["max_power"] = data["battery_current"] * data["battery_voltage"] > data["max_power"] ? data["battery_current"] * data["battery_voltage"] : data["max_power"]
    data["avg_power"] = (data["avg_power"] + data["battery_current"] * data["battery_voltage"]) / data["total_msgs"]
    data["max_mph"] = data["mph"] > data["max_mph"] ? data["mph"] : data["max_mph"]
    data["avg_mph"] = (data["avg_mph"] + data["mph"]) / data["total_msgs"]
    socket.emit('data', data)
    i = i + increment;

    if (flags.check_charged === 0)
        flags.check_charged = 1
}

const mph = (rpm) => {
    const mph = miles(rpm) * 60
    return mph
}

const miles = (rotations) => {
    const ratio = config['motor']['teeth'] / config['motor']['rear_teeth']  // gear ratio
    const wheel_circum = config['motor']['wheel_dia_in'] * Math.PI  // inch circumference of wheel
    const miles = rotations * ratio * wheel_circum / 63360  // total miles of rotations
    return miles
}
