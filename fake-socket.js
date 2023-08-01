// Socket for vesc-dash (Spoofer)

const frequency = 50; //ms between data emits

const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })
const config = require('./config.json')

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
    })

    // Socket disconnect
    socket.on('disconnect', (reason) => {
        console.log(`${socket.id} disconnected (${reason})`)
        clearInterval(intervalID)
    })
})

let i = 0;

// CAN message handler
function canHandler(socket) {
    data = {
        "erpm": (i*100 % 40000)-10000,
        "rpm": ((i*100 % 40000)-10000)/config['motor']['poles'],
        "motor_current": i % 300-150,
        "duty_cycle": i/100 % 2 - 1,
        "ah_consumed": i/500 % 16,
        "ah_regen": i/2000 % 16,
        "wh_consumed": i/2 % 800,
        "wh_regen": i/50 % 800,
        "mos_temp": (i/5+30) % 80,
        "mot_temp": (i/5+20) % 80,
        "battery_current": i % 160-80,
        "pid_position": i % 50000,
        "tachometer": (i*100 % 1000000)/config['motor']['poles'],
        "battery_voltage": 58-(i/20) % (58-40),
        "ids": "14 15 16 0 27",
        "mph": mph(((i*100 % 40000)-10000)/config['motor']['poles']),
        "odometer": miles((i*100 % 1000000)/config['motor']['poles']),
        "motor_voltage": i/2%58,
    }
    data['soc'] = (config['battery']['capacity_ah']-data['ah_consumed'])/config['battery']['capacity_ah']
    socket.emit('data', data)
    i = i +2;
}

const mph = (rpm) => {
    const mph = miles(rpm) * 60
    return mph
}

const miles = (rotations) => {
    const ratio = config['motor']['teeth'] / config['motor']['rear_teeth']  // gear ratio
    const wheel_dia = config['motor']['wheel_dia_in'] * Math.PI  // inch diameter of wheel
    const miles = rotations * ratio * wheel_dia / 63360  // total miles of rotations
    return miles
}