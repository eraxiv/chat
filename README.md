# Simple chat
Super simple chat. Uses socket.io to communicate with the server.

# Pre-requisites
- [AngularJs](https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.6/angular.min.js)
- [Socket.IO](https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.3.7/socket.io.min.js)
- [Bootstrap JS](https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js)
- [Bootstrap CSS](https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css)
- [Font Awesome](https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css)
- add code from `./socketio.js` to your server
- add `include chat` somewhere in your main jade 

Add chat to your js:
`var app = angular.module("app", ['chat']);`
