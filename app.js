let canvas = document.getElementById('canvas');
let redPikminContainer = document.querySelector(".redPikmin");
let pikminSpawnableContainer = document.querySelector(".pikminSpawnable");
let ctx = canvas.getContext('2d');

let mouseX = 0, mouseY = 0; // Mouse position
let objects = []; // Array to hold dynamic objects
let staticObjects = []; // Array to hold static objects (persistent)
let pikminRetrieved = [];
let objectRadius = 20; // Radius of the objects
let minDistanceFromMouse = 50;
let spawnLimit = 10;

let redPikminCount = 0;
let minOffset = 50;
let maxOffset = 200;

canvas.height = window.innerHeight - 10;
canvas.width = window.innerWidth;

let spawnerObj =
{
    x: canvas.width / 2,
    y: canvas.height / 2,
    color: '#00ff00',
    width: 50,
    height: 50
}

staticObjects.push(spawnerObj);

window.onload = function()
{
    pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
}

// Listen for mouse move event to track the mouse position
canvas.addEventListener('mousemove', (e) => 
{
    let rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Listen for click event to toggle object following
canvas.addEventListener('click', (e) => 
{
    let rect = canvas.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;

    staticObjects.forEach((spawnerObj) =>
    {
        if (mouseX >= spawnerObj.x &&
            mouseX <= spawnerObj.x + spawnerObj.width &&
            mouseY >= spawnerObj.y &&
            mouseY <= spawnerObj.y + spawnerObj.height) 
        {
            console.log("Spawner Clicked!");

            if (spawnLimit > 0)
            {
                // Create dynamic objects that follow the mouse
                let pikminObj = 
                {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    color: "#ff0000",
                    isFollowing: false, // Initially, objects are not following the mouse
                    offset: getRandomOffset()
                };

                objects.push(pikminObj);
                spawnLimit--;

                pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
            }   
        }
    });

    objects.forEach((pikminObj) => 
    {
        let dist = Math.hypot(pikminObj.x - clickX, pikminObj.y - clickY);
        if (dist <= objectRadius) 
        {
            console.log("Pikmin Clicked!");
            if (!pikminObj.isFollowing) 
            {
                pikminObj.isFollowing = true;
                pikminRetrieved.push(pikminObj);
                redPikminCount++;
                redPikminContainer.innerHTML = `<h1>Red Pikmin: ${redPikminCount}</h1>`;
            }
        }
    });
});

// Update position of following objects
function updateObjectPositions() 
{
    objects.forEach((pikminObj) => 
    {
        if (pikminObj.isFollowing) 
        {
            let dx = mouseX - pikminObj.x;
            let dy = mouseY - pikminObj.y;
            let distance = Math.hypot(dx, dy);

            if (distance > pikminObj.offset) 
            {
                let speedFactor = 0.05; // Slower movement
                pikminObj.x += dx * speedFactor;
                pikminObj.y += dy * speedFactor;
            }
        }
    });
}

// Function to draw dynamic objects
function drawPikmin() 
{
    // Instead of clearing the entire canvas, just redraw the moving objects
    objects.forEach(pikminObj => 
    {
        ctx.beginPath();
        ctx.arc(pikminObj.x, pikminObj.y, objectRadius, 0, Math.PI * 2);
        ctx.fillStyle = pikminObj.color;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();
    });
}

// Add static objects (These don't need to be updated every frame)
function drawStaticObjects() 
{
    // Example: Draw a spawner or any other object
    ctx.fillStyle = spawnerObj.color;
    ctx.fillRect(spawnerObj.x, spawnerObj.y, spawnerObj.width, spawnerObj.height);
}

// Draw static objects initially (they stay persistent)
drawStaticObjects();



// Main loop for animation
function animate() 
{
    updateObjectPositions(); // Update positions of dynamic objects
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only the dynamic layer
    drawStaticObjects(); // Redraw static objects to maintain them
    drawPikmin(); // Draw dynamic objects
    requestAnimationFrame(animate); // Loop the animation
}

animate(); // Start the animation loop

// Function to generate a random offset
function getRandomOffset() 
{
    return Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset;
}
