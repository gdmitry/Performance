(function () {
  // http://stackoverflow.com/questions/10906734/how-to-upload-image-into-html5-canvas
  var original;
  var imageLoader = document.querySelector('#imageLoader');
  var canvas = document.querySelector('#image');
  var ctx = canvas.getContext('2d');
  var worker = new Worker('scripts/worker.js');

  imageLoader.addEventListener('change', handleImage, false);

  function handleImage(e) {
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        original = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
  }

  // greys out the buttons while manipulation is happening
  // un-greys out the buttons when the manipulation is done
  function toggleButtonsAbledness() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].hasAttribute('disabled')) {
        buttons[i].removeAttribute('disabled')
      } else {
        buttons[i].setAttribute('disabled', null);
      }
    };
  }

  function WorkerException (message) {
    this.name = "WorkerException";
    this.message = message;
  }

  function manipulateImage(type) {
    var a, b, g, i, imageData, j, length, pixel, r, ref;
    var data = {
      type: type,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
    };

    worker.addEventListener('message', function callback(e) {
      var image = e.data;

      ctx.putImageData(image, 0, 0);
      worker.removeEventListener('message', callback, false);
    }, false);

    worker.addEventListener('error', function callback(error) {     
      worker.removeEventListener('message', callback, false);
      throw new WorkerException('Worker error');
    }, false);

    toggleButtonsAbledness();
    worker.postMessage(data);
    toggleButtonsAbledness();
  };

  function revertImage() {
    return ctx.putImageData(original, 0, 0);
  }

  document.querySelector('#invert').onclick = function () {
    manipulateImage("invert");
  };
  document.querySelector('#chroma').onclick = function () {
    manipulateImage("chroma");
  };
  document.querySelector('#greyscale').onclick = function () {
    manipulateImage("greyscale");
  };
  document.querySelector('#vibrant').onclick = function () {
    manipulateImage("vibrant");
  };
  document.querySelector('#revert').onclick = function () {
    revertImage();
  };


})();