const { Server } = require('socket.io')
const io = new Server(5002, { cors: { origin: '*' } })

// const can = require('socketcan')

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
    socket.on('subscribeToCAN', () => {
        console.log('client connected to can')
        canner(socket)
    })
})

function canner(client) {
    console.log('test')
}