const openCameraBtn = document.getElementById('openCamera');
const closeCameraBtn = document.getElementById('closeCamera');
const takePictureBtn = document.getElementById('takePicture');
const savePictureBtn = document.getElementById('savePicture');
const generateButton = document.getElementById('generateButton')
const descriptionElement = document.getElementById('description');
const readAloudButton = document.getElementById('readAloudButton');
const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');
const body = document.body;

let stream = null;

// Open Camera
const openCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block'; // Show the video feed
    canvas.style.display = 'none'; // Hide the canvas
    openCameraBtn.disabled = true;
    closeCameraBtn.disabled = false;
    takePictureBtn.disabled = false;
    let open_speech = new SpeechSynthesisUtterance();
    open_speech.text = "Camera opened"
    window.speechSynthesis.speak(open_speech);

    body.style.backgroundImage = "url('./back.png')";

    // Flip the video feed horizontally using CSS
    video.style.transform = 'scaleX(-1)';
  } catch (error) {
    alert('Error accessing camera: ' + error.message);
  }
};

if (openCameraBtn.disabled == true) {
  descriptionElement.innerHTML = 'Welcome to Our Project!'
}

// Close Camera
const closeCamera = () => {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    stream = null;

    // Hide video and keep the canvas if a picture was taken
    video.style.display = 'none';
    canvas.style.display = canvas.style.display === 'block' ? 'block' : 'none';

    openCameraBtn.disabled = false;
    closeCameraBtn.disabled = true;
    takePictureBtn.disabled = true;
    savePictureBtn.disabled = true;

    let close_speech = new SpeechSynthesisUtterance();
    close_speech.text = "Camera closed"
    window.speechSynthesis.speak(close_speech);
    body.style.backgroundImage = "url('./back2.png')";
  }
};

// Take Picture
const takePicture = async () => {
  if (stream) {
    // Set canvas size to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip the image horizontally on the canvas
    ctx.save(); // Save the current state
    ctx.scale(-1, 1); // Flip horizontally
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); // Draw flipped image
    ctx.restore(); // Restore the original state

    // Pause the video feed and hide it
    video.pause();
    video.style.display = 'none';

    // Show the canvas with the frozen picture
    canvas.style.display = 'block';

    savePictureBtn.disabled = false; // Enable the "Save Picture" button
    openCameraBtn.disabled = false;
    closeCameraBtn.disabled = false;
    body.style.backgroundImage = "url('./back2.png')";

    let picture_speech = new SpeechSynthesisUtterance();
    picture_speech.text = "Photo Taken"
    window.speechSynthesis.speak(picture_speech);

    descriptionElement.textContent = 'Generating description...';

  try {
    // Get the base64 image data from the canvas
    const capturedImage = canvas.toDataURL('image/png');

    // Send the image to the backend
    const response = await fetch('http://127.0.0.1:5000/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: capturedImage }),
    });

    // Handle the backend response
    const data = await response.json();
    if (data.error) {
      descriptionElement.textContent = `Error: ${data.error}`;
    } else {
      descriptionElement.textContent = data.description; // Display the generated description
      const utterance = new SpeechSynthesisUtterance(data.description);
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    descriptionElement.textContent = `Error: ${error.message}`;
  }
  }
};

// Save Picture
const savePicture = () => {
  if (canvas.width > 0 && canvas.height > 0) {
    const imageData = canvas.toDataURL('image/png'); // Convert canvas to a data URL
    const link = document.createElement('a'); // Create a link element
    link.href = imageData; // Set the href to the image data
    link.download = 'captured-image.png'; // Set the filename for download
    link.click(); // Trigger a click event to download the image
    let save_speech = new SpeechSynthesisUtterance();
    save_speech.text = "Photo saved"
    window.speechSynthesis.speak(save_speech);
  }
};

savePictureBtn.addEventListener('click', savePicture);

// Attach button events
openCameraBtn.addEventListener('click', openCamera);
closeCameraBtn.addEventListener('click', closeCamera);
takePictureBtn.addEventListener('click', takePicture);

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'f': // Open camera
      if (!openCameraBtn.disabled) openCamera();
      break;
    case 'j': // Close camera
      if (!closeCameraBtn.disabled) closeCamera();
      break;
    case ' ': // Take picture (space bar)
      event.preventDefault(); // Prevent page scrolling when space is pressed
      if (!takePictureBtn.disabled) takePicture();
      break;
    case 'Enter': // Save picture (Enter key)
      if (!savePictureBtn.disabled) savePicture();
      break;
  }
});

