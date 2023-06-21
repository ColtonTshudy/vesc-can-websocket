// Socket for vesc-dash (CAN)

const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })

const can = require('socketcan')

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
    'ids': '',
    'mph': 0,
    'odometer': 0,
    'motor_voltage': 0,
}

// Socket setup
io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
    socket.on('subscribeToCAN', () => {
        console.log('client connected to can')
        canHandler(socket)
    })
})

// CAN message handler
canHandler = (socket) => {
    console.log('test')

    const channel = can.createRawChannel('vcan0');
    channel.addListener('onMessage', (msg) => {
        const id = msg['id']
        const buf = msg['data']

        // Add ID to list of active IDs
        if (!data['id'].includes(`${id}`)) {
            data['id'] = data['id'] + `${id} `
        }

        switch (id) {
            case p1Addr:
                break;
            case p2Addr:
                break;
            case p3Addr:
                break;
            case p4Addr:
                break;
            case p5Addr:
                socket.emit('data', data)
                break;
            default:
                break;
        }
    })
}