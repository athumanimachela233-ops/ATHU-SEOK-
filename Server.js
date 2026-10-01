const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let activeUsers = {};
let ADMIN_PIN = "1234";

io.on('connection', (socket) => {
    socket.on('join_user', (data) => {
        const isAdmin = data.adminPin === ADMIN_PIN;
        const profilePic = data.profilePic || 'https://via.placeholder.com/40';
        activeUsers[socket.id] = { username: data.username, isAdmin: isAdmin, profilePic: profilePic };
        
        socket.emit('user_status', { isAdmin: isAdmin });
        io.emit('update_user_list', Object.values(activeUsers));
    });

    socket.on('chat_message', (data) => {
        io.emit('chat_message', data);
    });

    socket.on('message_read', (msgId) => {
        io.emit('message_read', msgId);
    });

    socket.on('admin_kick_user', (targetUsername) => {
        if (activeUsers[socket.id]?.isAdmin) {
            for (let id in activeUsers) {
                if (activeUsers[id].username === targetUsername) {
                    io.to(id).emit('kicked_notification');
                    delete activeUsers[id];
                    break;
                }
            }
            io.emit('update_user_list', Object.values(activeUsers));
        }
    });

    socket.on('admin_clear_chats', () => {
        if (activeUsers[socket.id]?.isAdmin) {
            io.emit('clear_chat_box');
        }
    });

    socket.on('disconnect', () => {
        delete activeUsers[socket.id];
        io.emit('update_user_list', Object.values(activeUsers));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server inaendeshwa kwenye http://localhost:${PORT}`);
});
          
