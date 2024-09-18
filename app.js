
    let canvas = document.getElementById('myCanvas');
    let redPikminContainer = document.querySelector(".redPikmin");

    let pikminCircle = canvas.getContext('2d');
    let pikminSpawn = canvas.getContext('2d');

    let mouseX = 0, mouseY = 0; // Mouse position
    let objects = []; // Array to hold objects
    let pikminRetrieved = [];
    let objectRadius = 20; // Radius of the objects
    let minDistanceFromMouse = 50;

    let redPikminCount = 0;
    let minOffset = 50;
    let maxOffset = 100;

    canvas.height = window.innerHeight - 10;
    canvas.width = window.innerWidth;

    let spawnerObj = 
    {
        x: 100,
        y: 100,
        width: 50,
        height: 50
    };

    // Create some objects randomly placed on the canvas
    for (let i = 0; i < 5; i++) 
    {
        let pikminObj = 
        {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: "#ff0000",
            isFollowing: false, // Initially, objects are not following the mouse
            offset: getRandomOffset()
        };

        objects.push(pikminObj);
    }

    // Listen for mouse move event to track the mouse position
    canvas.addEventListener('mousemove', (e) => 
    {
        let rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    // Listen for click event to determine if an object was clicked
    canvas.addEventListener('click', (e) => 
    {
        let rect = canvas.getBoundingClientRect();
        let clickX = e.clientX - rect.left;
        let clickY = e.clientY - rect.top;

        // Check if any object was clicked
        objects.forEach((pikminObj) => 
        {
            let dist = Math.hypot(pikminObj.x - clickX, pikminObj.y - clickY);

            if (dist <= objectRadius) 
            {
                if (pikminObj.isFollowing == false)
                {
                    pikminObj.isFollowing = true;

                    pikminRetrieved.push(pikminObj);

                    redPikminCount++;
                    redPikminContainer.innerHTML = `<h1>Red Pikmin: ${redPikminCount}</h1>`;
                }
                // Mark the object as following the mouse
            }
        });
    });

    // Function to get a random color for each object
    function generateColor() 
    {
        let colorsArray = ["0000ff", "ff0000", "800080"];
        let color = '#';
        let randomIndex;

        randomIndex = Math.floor(Math.random() * colorsArray.length);

        color += colorsArray[randomIndex];

        return color;
    }

    // Function to update the position of each object that is following the mouse
    function updateObjectPositions() 
    {
        objects.forEach((pikminObj) => 
        {
            if (pikminObj.isFollowing) 
            {
                let dx = mouseX - pikminObj.x;
                let dy = mouseY - pikminObj.y;
                let distance = Math.hypot(dx, dy);

                // Only move if the distance is greater than the minimum allowed distance
                if (distance > pikminObj.offset) 
                {
                    let speedFactor = 0.05; // Smaller value means slower following
                    pikminObj.x += dx * speedFactor;
                    pikminObj.y += dy * speedFactor;
                }
            }
        });
    }

    // Function to generate a random offset
    function getRandomOffset() 
    {
        return Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset;
    }

    // Function to draw all objects
    function drawPikmin() 
    {
        pikminCircle.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Draw each object
        objects.forEach(pikminObj => 
        {
            pikminCircle.beginPath();
            pikminCircle.arc(pikminObj.x, pikminObj.y, objectRadius, 0, Math.PI * 2); // Object radius 20
            pikminCircle.fillStyle = pikminObj.color;
            pikminCircle.fill();

            pikminCircle.lineWidth = 2;
            pikminCircle.strokeStyle = '#000000';
            pikminCircle.stroke();
            pikminCircle.closePath();
        });
    }

    function drawSpawner()
    {
        pikminSpawn.fillStyle = 'blue';
        pikminSpawn.fillRect(20, 20, 150, 100);

        console.log(pikminSpawn);
    }

    drawSpawner();

    // Main loop for animation
    function animate() 
    {
        updateObjectPositions(); // Update the object positions
        drawPikmin(); // Draw the objects
        requestAnimationFrame(animate); // Loop the animation
    }

    animate(); // Start the animation loop
