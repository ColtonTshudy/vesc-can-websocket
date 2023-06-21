// Socket for vesc-dash (Spoofer)

const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })

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

    // Socket subscribes to CAN updates
    socket.on('subscribeToCAN', () => {
        console.log(`${socket.id} connected to can`)
        setInterval(canHandler, 1000, socket)
    })

    // Socket disconnect
    socket.on('disconnect', (reason) => {
        console.log(`${socket.id} disconnected (${reason})`)
    })
})

// CAN message handler
function canHandler(socket) {
    console.log('test')
}