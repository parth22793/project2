import os
import datetime
from flask import Flask, render_template, redirect, jsonify, request, url_for, session
from flask_socketio import SocketIO, emit, send
from flask_session import Session


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

socketio = SocketIO(app)
Session(app)

channels = []


@app.route("/")
def index():
    try:
        return render_template("index.html", name=session["name"], lastChannel=session["lastChannel"], channels=channels)
    except KeyError:
        try:
            return render_template("index.html", name=session["name"], channels=channels)
        except KeyError:
            return render_template("index.html", channels=channels)


@app.route("/name", methods=["POST"])
def name():
    name = request.form.get("name")
    if name is not '':
        session["name"] = name
        return jsonify({"success": True, "name": name})
    else:
        return jsonify({"success": False})


@app.route("/lastChannel", methods=["POST"])
def lastChannel():
    channel = request.form.get("lastChannel")
    session["lastChannel"] = channel
    return '', 204


@app.route("/channel", methods=["POST"])
def channel():
    channel = request.form.get('channel')
    # Avoid creating channel with same name
    for elem in channels:
        if channel in elem.name:
            return jsonify({"success": False})
    # Create new channel
    newChannel = Channel(channel)
    channels.append(newChannel)

    # Dictionary objects to JSON objects
    channelsFeed = []
    for object in channels:
        channelsFeed.append(object.__dict__)
    return jsonify({"success": True, "channel": channel, "channels": channelsFeed})


@socketio.on("sendMessage")
def chat(data):
    channel = data["channel"]
    message = data["message"]
    for checkChannel in channels:
        # If channel exist then append the new message or emit a Not success message
        if checkChannel.name == channel:
            time = '{:%H:%M:%S}'.format(datetime.datetime.now())
            sender = session["name"]
            checkChannel.newMessage(message, sender, channel, time)

            last_message = checkChannel.messages[-1]
            emit("update", last_message, broadcast=True)
            return
    emit("update", 'Not success', broadcast=True)

@socketio.on("update")
def conect(data):
    channel = data["channel"]
    for checkChannel in channels:
        if checkChannel.name == channel:
            oldMessages = checkChannel.messages
            name = session["name"]
            emit("updateChat", (oldMessages, name), broadcast=True)
            return
    emit("updateChat", 'notFound', broadcast=True)

class Channel:
    def __init__(self, name):
        self.name = name
        self.messages = []

    def newMessage(self,message, sender, channel, time):
        new = {"message": message, "sender": sender, "channel": channel, "time": time}
        self.messages.append(new)
        while len(self.messages) > 100:
            del(self.messages[0])



# Private Chat for Users
users = {}

@app.route('/private')
def private():
    return render_template('private.html')

@app.route('/orginate')
def orginate():
    socketio.emit('server orginated', 'Something happened on the server!')
    return '<h1>Sent!</h1>'

@socketio.on('message from user', namespace='/messages')
def receive_message_from_user(message):
    print('USER MESSAGE: {}'.format(message))
    emit('from flask', message.upper(), broadcast=True)

@socketio.on('username', namespace='/private')
def receive_username(username):
    users[username] = request.sid
    #users.append({username : request.sid})
    #print(users)
    print('Username added!')

@socketio.on('private_message', namespace='/private')
def private_message(payload):
    recipient_session_id = users[payload['username']]
    message = payload['message']

    emit('new_private_message', message, room=recipient_session_id)


if __name__ == '__main__':
    socketio.run(app)
