import express from 'express'
import cors from 'cors'
import {Server} from 'socket.io'
import http from 'http'
import { leaveRoom, userConnected, userDisconnected } from './sockets/user.js';

const app= express();
const PORT= process.env.PORT || 3001;

app.use(cors());

const server= http.createServer(app);

let users= [];
let rooms= {};

const io= new Server(server, {
    cors: {
        origin: '*'
    }
})

io.on('connection', (socket)=>{
    users= Array.from(io.sockets.sockets).map(socket => socket[0]);

    userConnected(socket, users);
    socket.on('disconnect', ()=> {
        const roomId= socket.room;
        if(roomId!==undefined){
            rooms[roomId].users= rooms[roomId].users.filter(user => user.id!==socket.id);
            leaveRoom(socket, roomId, rooms[roomId].users);
        }
        userDisconnected(socket, users);
    });

    socket.on('join-room', ({roomId})=>{
        console.log(`Room ${roomId} : Joined -> ${socket.id}`);
        socket.join(roomId);
        socket.room= roomId;
        if(rooms[roomId]===undefined){
            rooms[roomId]= {users: [], position: 1, quote: ''};
        }
        rooms[roomId].users.push({id: socket.id, wpm: 0, progress: 0, position: null, bg: `#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`});
        console.log(`Room ${roomId} Details : `, rooms[roomId]);
        socket.to(roomId).emit('user-joined', rooms[roomId].users);
        socket.emit('user-joined', rooms[roomId].users);
    })

    socket.on('leave-room', ({roomId})=> {
        rooms[roomId].users= rooms[roomId].users.filter(user => user.id!==socket.id);
        leaveRoom(socket, roomId, rooms[roomId].users)
    });

    socket.on('set-quote', ({roomId, quote})=>{
        rooms[roomId].quote= quote;
        socket.to(roomId).emit('set-quote-done', rooms[roomId].quote);
        socket.emit('set-quote-done', rooms[roomId].quote);
    })

    socket.on('increase-progress', ({roomId, progress=0, position=rooms[roomId].position, wpm})=>{
        if(rooms[roomId]===undefined){
            rooms[roomId]= {users: [], position: 1};
        }
        for(let i=0; i<rooms[roomId].users.length; i++){
            if(position===null){
                rooms[roomId].position= 1;
                rooms[roomId].users[i].progress= 0;
                rooms[roomId].users[i].position= null; 
                rooms[roomId].users[i].wpm= 0;
            } else{
                if(rooms[roomId].users[i].id===socket.id){
                    rooms[roomId].users[i].progress= progress;
                    rooms[roomId].users[i].wpm= wpm;
                }
                if(rooms[roomId].users[i].progress===100 && rooms[roomId].users[i].position===null){
                    rooms[roomId].users[i].position= rooms[roomId].position++;
                }
            }
        }
        console.log('room users : ', rooms[roomId].users);
        socket.to(roomId).emit('progress-changed', rooms[roomId].users);
        socket.emit('progress-changed', rooms[roomId].users);
    })

    socket.on('reset-stats', ({roomId})=>{
        rooms[roomId].position= 1;
        console.log(rooms[roomId].users.filter(user => ({id: user.id, bg: user.bg, progress: null, position: null})));
        rooms[roomId].users= rooms[roomId].users.filter(user => ({id: user.id, bg: user.bg, progress: null, position: null}));
        socket.to(roomId).emit('reset-done', rooms[roomId].users);
        socket.emit('reset-done', rooms[roomId].users);
    })

    socket.on('start-race', ({roomId})=>{
        socket.to(roomId).emit('race-started');
    })
})

app.get('/', (req, res)=>{
    res.send('Type Racer Home Page');
})

server.listen(PORT, ()=>{
    console.log('Type Racer Server Started on PORT : ', PORT);
})