    $(function(){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        var appendRoomFlag = false
        socket.on("connect", function() {
            // username
            if (!localStorage.getItem("username")) {
                window.usernameGlobal = prompt("Please enter your name:",  "username");
                usernameGlobal = usernameGlobal.charAt(0).toUpperCase() + usernameGlobal.slice(1);
                localStorage.setItem("username",usernameGlobal);
            } else {
                window.usernameGlobal = localStorage.getItem("username");
            }
            $("#username").html("Logged in as " + usernameGlobal);
            $("#message_submit").attr("disabled", true);

            socket.emit("userConnected", {"username":usernameGlobal})
            socket.emit("requestLoadRooms");

        })

        // send message
        // enter key triggers click message send button
        $("#message_box").on("keyup", function(key) {
            if ($(this).val().length > 0) {
                $("#message_submit").attr("disabled", false);
                if (key.keyCode === 13) {
                    $("#message_submit").click();
                }
            } else {
                $("#message_submit").attr("disabled", true);
            }
        });
        // click on send button to send message
        $("#message_submit").on("click", function() {
            $("#message_submit").attr("disabled", true);
            const message = $("#message_box").val();
            const time = new Date().toLocaleString();
            $("#message_box").val("");
            socket.emit("roomMessage", {"message":message, "username":usernameGlobal, "time":time, "room":localStorage.getItem("activeRoom")});
        });
        // display message from users
        socket.on("sendToRoom", data => {
            load_messages(data.history);
        })

        // add new room request
        $("#add_new_room_submit").on("click", function(){
            $("#popUpWindow").show();
            $("#pop_up_addroom").show();
            $("#pop_up_input").focus();
        })
        $("#pop_up_input").on("keyup", function(key) {
            if ($(this).val().length>0) {
                if (key.keyCode === 13) {
                    let roomName = $(this).val();
                    roomName = roomName.charAt(0).toUpperCase()+roomName.slice(1);
                    $("#popUpWindow").hide();
                    $("#pop_up_addroom").hide();
                    $("#pop_up_input").val("");
                    socket.emit("requestAddRoom", {"roomName":roomName, "username":usernameGlobal});
                }
            }
        })
        // add new room response
        socket.on("updateRoom", data => {
            if (data.error === "") {
                appendRoom(data["roomName"]);
            } else {
                if (data.username === usernameGlobal) {
                    alert(data.error);
                }
            }
        })
        // load rooms
        socket.on("loadRooms", data => {
            if (data.error === "") {
                loadRooms(data);
                if (data.username && (data.username === usernameGlobal)) {
                    $("#"+data.room).click();
                }
            }
            else if (data.username === usernameGlobal) {
                alert(data.error);
            }
        })

        // click to join room
        $("#room_list").on("click", function(e) {
            const target = e.target;
            if (target.matches("li")) {
                $(target).addClass("active");
                $(target).siblings().removeClass("active");
                let newroom = target.innerHTML;
                let room = localStorage.getItem("activeRoom")
                localStorage.setItem("activeRoom", newroom)
                if (newroom === room && appendRoomFlag === false) {
                    message = `already in ${room} room.`
                    console.log("if")
                    printSysMsg(message);
                } else {
                    console.log("else")
                    leaveRoom(room);
                    joinRoom(newroom);
                }
                $("#message_box").focus();
                appendRoomFlag = false;
            }
        })
        // someone joined the room
        socket.on("joined", data => {
            if (data.username === usernameGlobal) {
                load_messages(data.history);
            } else {
                printSysMsg(data.message);
            }
        })
        // someone left the room
        socket.on("left", data => {
            printSysMsg(data.message);
        })

        // private message
        $("#chat_window").on("click", function(e) {
            const target = e.target;
            if (target.matches("p")) {
                let receiver = target.children[0].innerHTML;
                $("#private_chat_button").html(`Message ${receiver}`);
                $("#popUpWindow").show();
                $("#pop_up_privatechat").show();
            }
        })
        //modal close button
        $(".closeButton").on("click", function() {
            $("#popUpWindow").hide();
            $("#pop_up_addroom").hide();
            $("#pop_up_privatechat").hide();

        })

// functions==============================================================================
// functions==============================================================================

        function leaveRoom(data) {
            socket.emit("requestLeave", {"username":usernameGlobal, "room":data});
        }

        function joinRoom(data) {
            socket.emit("requestJoin", {"username":usernameGlobal, "room":data});
        }

        function printSysMsg(message) {
            const p = document.createElement("p");
            p.innerHTML = message;
            p.className = "sysMessage";
            $("#chat_window").append(p);
            $(".chat_window_container").scrollTop(500000);
        }

        function loadRooms(data) {
            $("#room_list").html("");
            appendRooms(data);
        }

        function appendRooms(data) {
            for (i  in data.rooms) {
                const li = document.createElement("li");
                li.className = "list-group-item";
                li.setAttribute("id", data.rooms[i]);
                li.innerHTML = data.rooms[i];
                $("#room_list").append(li);
            }
                if (!localStorage.getItem("activeRoom")) {
                    room = "General";
                } else if (data.rooms.includes(localStorage.getItem("activeRoom"))) {
                    room = localStorage.getItem("activeRoom");
                }
                else {
                    room = "General";
                }
                appendRoomFlag = true;
                $("#"+room).addClass("active");
                $("#"+room).click();
        }

        function load_messages(data) {
            $("#chat_window").html("");
            for (i in data) {
                const p = document.createElement("p");
                const mes = document.createElement("p");
                const br = document.createElement("br");
                const messageUsername = document.createElement("span");
                const time = document.createElement("span");
                time.innerHTML = data[i]["time"];
                time.className = "messageTime";
                messageUsername.innerHTML = data[i]["username"];
                messageUsername.className = "messageUsername";
                p.innerHTML = messageUsername.outerHTML + br.outerHTML + data[i]["message"] + br.outerHTML + time.outerHTML;
                if (data[i]["username"] === usernameGlobal) {
                    p.className = "messageFloatRight";
                } else {
                    p.className = "messageFloatLeft";
                }
                $("#chat_window").append(p);
            }
            $(".chat_window_container").scrollTop(500000);
        }
    });
