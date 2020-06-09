   // New Channel Create
    document.addEventListener('DOMContentLoaded', () => {
      if (document.querySelector('#channelContainer')){
        document.querySelector('#formChannel').onsubmit = () => {

          //form request and formData
          let request = new XMLHttpRequest;
          let data = new FormData();
          let channel = document.querySelector('#channel').value;
          if (channel == '') {
            document.querySelector('#channelMessage').innerHTML = "This field can`t be empty!";
            return false;
          } else {
            data.append('channel', channel);
            request.open('POST', '/channel');
            request.send(data);
            request.onload = () => {
              let data = JSON.parse(request.responseText);
              if (data.success){
                let list = document.querySelector('#channelList');
                while (list.firstChild) {
                  list.removeChild(list.firstChild);
                }
                for (let i = 0; i < data.channels.length ; i++){
                  let elem = document.createElement('li');
                  elem.className = 'channel-list-item';
                  elem.innerHTML = data.channels[i]["name"];
                  list.append(elem);
                }
                document.querySelector('#channelMessage').innerHTML = `Your channel ${channel} has been created`;
              }else{
                document.querySelector('#channelMessage').innerHTML = `There was an error. ${channel} already exist`;
              }
            }
            // Stop the form submission
            return false;
          }
        }
      }
    });
