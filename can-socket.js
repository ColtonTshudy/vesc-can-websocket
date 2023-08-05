// Socket for vesc-dash (CAN)

var can = require('socketcan');
const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })
const config = require('./config.json')

// VESC CAN message IDs
const p1Addr = 0x009 << 8
const p2Addr = 0x00e << 8
const p3Addr = 0x00f << 8
const p4Addr = 0x010 << 8
const p5Addr = 0x01b << 8

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
    'ids': [],
    'mph': 0,
    'odometer': 0,
    'motor_voltage': 0,
}

// Socket connect
io.on('connection', (socket) => {
    // console.log(`${socket.id} connected`)

    // Socket subscribes to CAN updates
    socket.on('subscribeToCAN', () => {
        // console.log(`${socket.id} connected to can`)
        socket.emit('config', config)
        canHandler(socket)
    })

    // Socket disconnect
    socket.on('disconnect', (reason) => {
        // console.log(`${socket.id} disconnected (${reason})`)
    })
})

// CAN message handler
canHandler = (socket) => {
    // console.log('handling can')

    var channel = can.createRawChannel('can0', true);

    channel.addListener('onMessage', (msg) => {
        const id = msg['id']
        const buf = msg['data']

        // Add ID to list of active IDs
        if (!data['ids'].includes(id)) {
            data['ids'].push(id)
        }

        switch (id) {
            case p1Addr:
                data['erpm'] = signed32((buf[0] << 24) + (buf[1] << 16) + (buf[2] << 8) + buf[3])
                data['rpm'] = data['erpm'] / config['motor']['poles']
                data['motor_current'] = signed16((buf[4] << 8) + buf[5]) / 10
                data['duty_cycle'] = signed16((buf[6] << 8) + buf[7]) / 1000
                data['mph'] = mph(data['rpm'])
                data['motor_voltage'] = data['rpm'] / config['motor']['kv']
                socket.emit('data', data)
                break;
            case p2Addr:
                data['ah_consumed'] = ((buf[0] << 24) + (buf[1] << 16) + (buf[2] << 8) + buf[3]) / 10000
                data['ah_regen'] = ((buf[4] << 24) + (buf[5] << 16) + (buf[6] << 8) + buf[7]) / 10000
                break;
            case p3Addr:
                data['wh_consumed'] = ((buf[0] << 24) + (buf[1] << 16) + (buf[2] << 8) + buf[3]) / 10000
                data['wh_regen'] = ((buf[4] << 24) + (buf[5] << 16) + (buf[6] << 8) + buf[7]) / 10000
                break;
            case p4Addr:
                data['mos_temp'] = signed16((buf[0] << 8) + buf[1]) / 10
                data['mot_temp'] = signed16((buf[2] << 8) + buf[3]) / 10
                data['battery_current'] = signed16((buf[4] << 8) + buf[5]) / 10
                data['pid_position'] = ((buf[6] << 8) + buf[7])
                break;
            case p5Addr:
                tachometer_erpm = ((buf[0] << 24) + (buf[1] << 16) + (buf[2] << 8) + buf[3])
                data['tachometer'] = tachometer_erpm / config['motor']['poles']
                data['battery_voltage'] = ((buf[4] << 8) + buf[5]) / 10
                data['odometer'] = miles(data['tachometer'])
                break;
            default:
                break;
        }
    })
    channel.start()
}

// Turn a 16 bit unsigned integer into a signed integer
const signed16 = (int_16) => {
    let int_16_s = int_16
    if (int_16 > 32767)
        int_16_s = -((int_16 - 1) ^ 0b1111111111111111)
    return int_16_s
}

// Turn a 32 bit unsigned integer into a signed integer
const signed32 = (int_32) => {
    let int_32_s = int_32
    if (int_32 > 2147483647)
        int_32_s = -((int_32 - 1) ^ 0b11111111111111111111111111111111)
    return int_32_s
}

// Convert rpm to mph
const mph = (rpm) => {
    const mph = miles(rpm) * 60
    return mph
}

// Convert a number of rotations to miles
const miles = (rotations) => {
    const ratio = config['motor']['teeth'] / config['motor']['rear_teeth']  // gear ratio
    const wheel_dia = config['motor']['wheel_dia_in'] * Math.PI  // inch diameter of wheel
    const miles = rotations * ratio * wheel_dia / 63360  // total miles of rotations
    return miles
}