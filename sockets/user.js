export const userConnected= (socket, users)=>{
    console.log('Connected : ', socket.id);
    console.log('Users : ', users);
    console.log('**********************');
}

export const userDisconnected= (socket, users)=>{
    // socket.emit('leave-room', {roomId: socket.room})
    users= users.filter(user => user!=socket.id);
    console.log('Disconnected : ', socket.id);
    console.log('Users : ', users);
    console.log('**********************');
}

export const leaveRoom= (socket, roomId, roomUsers)=>{
    console.log(`Room ${roomId} : Left -> ${socket.id}`);
    socket.to(roomId).emit('user-left', roomUsers);
    socket.emit('user-left', []);
    socket.leave(roomId);
    console.log(`Users ${roomId} : ${roomUsers}`);
}