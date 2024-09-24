let canvas = document.getElementById('canvas');
let redPikminContainer = document.querySelector(".redPikmin");
let pikminSpawnableContainer = document.querySelector(".pikminSpawnable");
let ctx = canvas.getContext('2d');

let mouseX = 0, mouseY = 0; // Mouse position
let pikminObjects = []; // Array to hold dynamic pikminObjects
let staticObjects = []; // Array to hold static pikminObjects (persistent)
let spawnTokenObjects = [];
let pikminRetrieved = [];
let enemyObjects = [];
let objectRadius = 20; // Radius of the pikminObjects
let minDistanceFromMouse = 50;
let spawnLimit = 1;

let redPikminCount = 0;
let minOffset = 50;
let maxOffset = 200;

let retrieveAnimationRunning = false;
let secondaryRetrieveAnimationRunning = false;
let primaryPikmin;
let secondaryPikmin;

canvas.height = window.innerHeight - 10;
canvas.width = window.innerWidth;

let spawnerObj =
{
    width: 50,
    height: 50,
    x: (canvas.width / 2) - 50,
    y: (canvas.height / 2) - 50,
    color: '#00ff00'
}

staticObjects.push(spawnerObj);

let enemyObj = 
{
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    color: '#800080',
    width: 50,
    height: 50
}

enemyObjects.push(enemyObj);

for (let i = 0; i < 9; i++) 
{
    let spawnTokenObj = 
    {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        color: "#00ffff",
        isFollowing: false,
        isErased: false,
        isClicked: false,
        isBeingRetrieved: false
    };
    spawnTokenObjects.push(spawnTokenObj);
}

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
                // Create dynamic pikminObjects that follow the mouse
                let pikminObj = 
                {
                    x: spawnerObj.x - 20,
                    y: spawnerObj.y - 20,
                    color: "#ff0000",
                    isFollowing: false,
                    isAtOffset: false,
                    isRetrieving: false,
                    firstOffset: 50,
                    secondOffset: -50,
                    offset: getRandomOffset()
                };

                pikminObjects.push(pikminObj);
                spawnLimit--;

                pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
            }   
        }
    });

    pikminObjects.forEach((pikminObj) => 
    {
        let dist = Math.hypot(pikminObj.x - clickX, pikminObj.y - clickY);
        if (dist <= objectRadius) 
        {
            console.log("Pikmin Clicked!");
            if (!pikminObj.isFollowing && !pikminObj.isRetrieving) 
            {
                pikminObj.isFollowing = true;
                pikminRetrieved.push(pikminObj);
                redPikminCount++;
                redPikminContainer.innerHTML = `<h1>Red Pikmin: ${redPikminCount}</h1>`;
            }
        }
    });

    spawnTokenObjects.forEach((tokenObj) =>
    {
        let dist = Math.hypot(tokenObj.x - clickX, tokenObj.y - clickY);

        if (dist <= objectRadius && pikminRetrieved.length != 0) 
        {
            console.log("Spawn Token Clicked!");

            if (!tokenObj.isErased)
            {
                if (!retrieveAnimationRunning)
                {
                    for (let i = 0; i < pikminRetrieved.length; i++)
                    {
                        if (pikminRetrieved[i].isFollowing)
                        {
                            tokenObj.isBeingRetrieved = true;
                            tokenObj.isClicked = true;
                        
                            pikminRetrieved[i].isFollowing = false;
                            pikminRetrieved[i].isRetrieving = true;
                        
                            redPikminCount--;
                            primaryPikmin = pikminRetrieved[i];
                            tokenRetrieveAnimation();
                            return;
                        }
                    }
                }
                else if (retrieveAnimationRunning && !secondaryRetrieveAnimationRunning)
                {
                    for (let i = 0; i < pikminRetrieved.length; i++)
                    {
                        if (pikminRetrieved[i].isFollowing)
                        {
                            tokenObj.isBeingRetrieved = true;
                            tokenObj.isClicked = true;
                        
                            pikminRetrieved[i].isFollowing = false;
                            pikminRetrieved[i].isRetrieving = true;
                        
                            redPikminCount--;
                            secondaryPikmin = pikminRetrieved[i];
                            secondaryRetrieveAnimation();
                            return;
                        }
                    }
                }  
                    
                function tokenRetrieveAnimation()
                {
                    let tokenOffsetX = tokenObj.x + primaryPikmin.firstOffset;
                    let tokenOffsetY = tokenObj.y;
                    
                    retrieveAnimationRunning = true;
                
                    moveToToken(primaryPikmin, tokenOffsetX, tokenOffsetY);
                
                    // Check if object2 has reached the offset position
                    if (primaryPikmin.x === tokenOffsetX && primaryPikmin.y === tokenOffsetY) 
                    {
                        primaryPikmin.isAtOffset = true;
                        tokenObj.isFollowing = true;
                    }
                
                    console.log(tokenObj.isErased);
                
                    if (tokenObj.isErased == true)
                    {
                        console.log("FIRST ANIMATION CANCELLED");
                        spawnLimit++;
                        primaryPikmin.isRetrieving = false;
                        tokenObj.isBeingRetrieved = false;
                        retrieveAnimationRunning = false;
                        cancelAnimationFrame(tokenRetrieveAnimation);
                        return;
                    }
                
                    requestAnimationFrame(tokenRetrieveAnimation);
                }
            
                function secondaryRetrieveAnimation()
                {
                    let tokenOffsetX = tokenObj.x + secondaryPikmin.firstOffset;
                    let tokenOffsetY = tokenObj.y;
                
                    secondaryRetrieveAnimationRunning = true;
                
                    moveToSecondaryToken(secondaryPikmin, tokenOffsetX, tokenOffsetY);
                
                    // Check if object2 has reached the offset position
                    if (secondaryPikmin.x === tokenOffsetX && secondaryPikmin.y === tokenOffsetY) 
                    {
                        secondaryPikmin.isAtOffset = true;
                        tokenObj.isFollowing = true;
                    }
                
                    console.log(tokenObj.isErased);
                
                    if (tokenObj.isErased == true)
                    {
                        console.log("SECOND ANIMATION CANCELLED");
                        spawnLimit++;
                        secondaryPikmin.isRetrieving = false;
                        tokenObj.isBeingRetrieved = false;
                        secondaryRetrieveAnimationRunning = false;
                        
                        cancelAnimationFrame(secondaryRetrieveAnimation);
                        return;
                    }
                
                    requestAnimationFrame(secondaryRetrieveAnimation);
                }
            }
        }
    })
});

function moveToToken(obj, targetX, targetY, speed = 0.5) 
{
    let dx = targetX - obj.x;
    let dy = targetY - obj.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > speed) 
    {
        obj.x += (dx / distance) * speed;
        obj.y += (dy / distance) * speed;
    } 
    else 
    {
        obj.x = targetX;
        obj.y = targetY;
    }
}

function moveToSecondaryToken(obj, targetX, targetY, speed = 0.5) 
{
    let dx = targetX - obj.x;
    let dy = targetY - obj.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > speed) 
    {
        obj.x += (dx / distance) * speed;
        obj.y += (dy / distance) * speed;
    } 
    else 
    {
        obj.x = targetX;
        obj.y = targetY;
    }
}

// Update position of following pikminObjects
function updateObjectPositions() 
{
    pikminObjects.forEach((pikminObj) => 
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

function updateTokenPositions()
{
    spawnTokenObjects.forEach((tokenObj) => 
        {
            if (tokenObj.isFollowing) 
            {
                let dx = spawnerObj.x - tokenObj.x;
                let dy = spawnerObj.y - tokenObj.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
    
                if (distance < 10) 
                {
                    tokenObj.isFollowing = false;
                    ctx.clearRect(tokenObj.x - objectRadius, tokenObj.y - objectRadius, objectRadius * 2, objectRadius * 2);
                    tokenObj.isErased = true;
                }

                let speed = 0.5;
                tokenObj.x += (dx / distance) * speed;
                tokenObj.y += (dy / distance) * speed;
            }
        });
}

function updateSpawnAvailable()
{
    pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
}

function drawSpawnTokens()
{
    // Instead of clearing the entire canvas, just redraw the moving pikminObjects
    spawnTokenObjects.forEach(spawnTokenObj => 
    {
        if (spawnTokenObj.isErased == false)
        {
            ctx.beginPath();
            ctx.arc(spawnTokenObj.x, spawnTokenObj.y, objectRadius, 0, Math.PI * 2);
            ctx.fillStyle = spawnTokenObj.color;
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            ctx.closePath();

            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText("1", spawnTokenObj.x, spawnTokenObj.y);
        }
    });
}

// Function to draw dynamic pikminObjects
function drawPikmin() 
{
    // Instead of clearing the entire canvas, just redraw the moving pikminObjects
    pikminObjects.forEach(pikminObj => 
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

function drawEnemy()
{
    // Example: Draw a spawner or any other object
    ctx.fillStyle = enemyObj.color;
    ctx.fillRect(enemyObj.x, enemyObj.y, enemyObj.width, enemyObj.height);

    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let centerX = enemyObj.x + enemyObj.width / 2;
    let centerY = enemyObj.y + enemyObj.height / 2;

    ctx.fillText("10", centerX, centerY);
}

// Add static pikminObjects (These don't need to be updated every frame)
function drawStaticObjects() 
{
    // Example: Draw a spawner or any other object
    ctx.fillStyle = spawnerObj.color;
    ctx.fillRect(spawnerObj.x, spawnerObj.y, spawnerObj.width, spawnerObj.height);
}

// Draw static pikminObjects initially (they stay persistent)
drawStaticObjects();

// Main loop for animation
function animate() 
{
    updateObjectPositions(); // Update positions of dynamic pikminObjects
    updateTokenPositions();
    updateSpawnAvailable();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only the dynamic layer
    drawStaticObjects(); // Redraw static pikminObjects to maintain them
    drawPikmin(); // Draw dynamic pikminObjects
    drawSpawnTokens();
    drawEnemy();
    requestAnimationFrame(animate); // Loop the animation
}

animate(); // Start the animation loop

// Function to generate a random offset
function getRandomOffset() 
{
    return Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset;
}