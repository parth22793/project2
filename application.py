import os
from time import localtime, strftime
from flask import Flask, render_template, url_for, g, request, redirect, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)



app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

rooms = {}
rooms["General"]=[]
roomsList = ["General"]
usersList={}
limit = 100

@app.route("/")
def index():
    return render_template("index.html", rooms=rooms)


@socketio.on("requestLoadRooms")
def requestLoadRooms():
    error = ""
    emit("loadRooms", {"rooms": roomsList, "error":error})

@socketio.on("userConnected")
def userConnected(data):
    usersList[data["username"]]=request.sid

@socketio.on("roomMessage")
def roomMessage(data):
    room = data["room"]
    new_message ={"message":data["message"], "username":data["username"], "time":data["time"]}
    rooms[room].append(new_message)
    if (len(rooms[room])>limit):
        rooms[room].pop(0)
    emit("sendToRoom", {"history":rooms[room]}, room=room)


@socketio.on("requestJoin")
def on_join(data):
    username = data["username"]
    room = data["room"]
    join_room(room)
    emit("joined", {"message": username + " has join the " + room + " room.", "username":username, "history":rooms[room], "room":room}, room=room)

@socketio.on("requestLeave")
def on_leave(data):
    username = data["username"]
    room = data["room"]
    leave_room(room)
    emit("left", {"message": username + " has left the " + room + " room."}, room=room)

@socketio.on("requestAddRoom")
def new_room(data):
    error = ""
    room = None
    roomName = data["roomName"]
    if roomName in roomsList:
        error = "Room already exist. Please select another name for room."
    elif ' ' in roomName:
        error = "Room name cannot contain spaces."
    elif roomName[0].isdigit():
        error = "Room name cannot start with a number."
    else:
        rooms[roomName]=[]
        roomsList.append(roomName)
        room = roomName
    # emit("updateRoom", {"roomName":roomName, "username":data["username"], "error":error}, broadcast=True)
    emit("loadRooms", {"rooms": roomsList, "username":data["username"], "room":room, "error":error}, broadcast=True)

if __name__ == "__main__":
    socketio.run(app)
