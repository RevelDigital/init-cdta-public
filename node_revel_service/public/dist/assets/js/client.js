console.log('this works');
const handshake = new Postmate.Model({
  // Expose your model to the Parent. Property values may be functions, promises, or regular values
  height: () => document.height || document.body.offsetHeight
});

// When parent <-> child handshake is complete, events may be emitted to the parent
handshake.then(parent => {
  console.log('ddd');
  parent.emit('some-event', 'Hello, World!');
});

window.addEventListener('message',function(event) {
  console.log('received response:  ',event.data);
},false);
