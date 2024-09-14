const express = require('express');
const app = express();
const https = require('http').createServer(app);
const path = require('path')
const io = require('socket.io')(https);

const { genrateMessage, genrateLocationMessage } = require('./utils/message')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

console.log("current dir is" + __dirname)
const publicDir = path.join(__dirname, '../public')

const port = process.env.PORT || 4001;

  
  io.listen(3002);

io.on('connection', (socket) => {
    console.log('user connected!!!!')


    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error)
        }
        console.log(user.username)
        socket.join(user.room);
        socket.emit('message', genrateMessage(`${user.username} welcome!`));
        socket.broadcast.to(user.room).emit('message', genrateMessage(user.username, `${user.username} has joined`))
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


        callback();
    })
    socket.on('getQuestions', (data, callback) => {
        const user = getUser(socket.id);
        socket.broadcast.to(data);
        callback();
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', genrateMessage(user.username, `${user.username} has left!`))
            
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

})
app.use(express.static(publicDir));

https.listen(port, () => {
    console.log('connection is listing on' + port);
})