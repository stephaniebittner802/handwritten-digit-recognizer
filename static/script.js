const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.onload = () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

let drawing = false;

// Using Mouse
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});
canvas.addEventListener("mousemove", draw);

// Using Touch Screen
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawing = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    drawing = false;
    ctx.beginPath();
});

function setDrawingStyle(){
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
}

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!drawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    setDrawingStyle();

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});


function draw(event) {
    if (!drawing) return;
    setDrawingStyle();

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById("prediction").innerText = "?";
}

let isPredicting = false;

document.getElementById("submitBtn").addEventListener("click", function () {
    if (isPredicting) return;
    isPredicting = true;

    const predictionDisplay = document.getElementById("prediction");
    const imageData = canvas.toDataURL("image/png");

    fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.prediction !== undefined) {
            predictionDisplay.innerText = data.prediction;
        } else {
            predictionDisplay.innerText = "Error";
        }
    })
    .catch(() => {
        predictionDisplay.innerText = "Error";
    })
    .finally(() => {
        isPredicting = false;
    });
});