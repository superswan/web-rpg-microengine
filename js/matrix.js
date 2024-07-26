// matrix.js
let matrixInterval;
const matrixCanvas = document.getElementById('matrixCanvas');
const matrixCtx = matrixCanvas.getContext('2d');

function setupMatrixCanvas() {
    matrixCanvas.height = window.innerHeight;
    matrixCanvas.width = window.innerWidth;
}

function drawMatrix() {
    const matrix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const chars = matrix.split("");

    const fontSize = 10;
    const columns = matrixCanvas.width / fontSize;
    const drops = [];

    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function draw() {
        matrixCtx.fillStyle = "rgba(0, 0, 0, 0.04)";
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        matrixCtx.fillStyle = "#00FF00"; // Green text
        matrixCtx.font = fontSize + "px arial";
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            matrixCtx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    matrixInterval = setInterval(draw, 35);
}

function stopMatrix() {
    clearInterval(matrixInterval);
    matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

document.addEventListener('DOMContentLoaded', () => {
    setupMatrixCanvas();
    window.addEventListener('resize', setupMatrixCanvas);

    // Listen for custom events to start/stop the matrix
    document.addEventListener('startMatrix', drawMatrix);
    document.addEventListener('stopMatrix', stopMatrix);
});

export { drawMatrix, stopMatrix };