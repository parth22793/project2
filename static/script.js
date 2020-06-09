// Create a display name
document.addEventListener('DOMContentLoaded', () => {

  if (document.querySelector('#formDisplay')){

    document.querySelector('#formDisplay').onsubmit = () => {

      let request = new XMLHttpRequest();
      let name = document.querySelector('#name').value;
      let data = new FormData();
      data.append('name', name);

      // Open the already created request to send
      request.open('POST', '/name');

      request.send(data)
      // Response
      request.onload = () => {
        let data = JSON.parse(request.responseText);
        if (data.success){
          document.querySelector('#form').style.display = 'none';
          let h = document.createElement('h3');
          h.innerHTML = 'Welcome ' + data.name + '!';
          document.querySelector('#user-data').dataset.username = data.name;
          document.querySelector('#DisplayName').append(h);
          document.querySelector('#channelContainer').style.display = '';
        }else{
          document.querySelector('#DisplayName').innerHTML = 'Humm!, Unfortunately there was an error.. Please try again';
        }
      }
      return false;
    }
  }
});
