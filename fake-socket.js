const io = require('socket.io')()
// const can = require('socketcan')

io.on('connection', (client) => {
    client.on('subscribeToCan', () => {
        console.log('client connected to can')
        canner(client)
    })
})

function canner(client) {
    
}