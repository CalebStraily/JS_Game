//selects the elements needed from the HTML for use in the .js
let mainMenu = document.querySelector('.main-menu');
let mainSection = document.querySelector('.main-section');
let playButton = document.querySelector('.main-menu button');
let bgmAudio = document.getElementById('gameBGM');
let mainMenuBGM = document.getElementById('mainMenuBGM');
let canvas = document.getElementById('canvas');
let pikminContainer = document.querySelector(".pikmin-container");
let howToPlayButton = document.querySelector(".howToPlayButton");
let redPikminContainer = document.querySelector(".redPikmin");
let pikminSpawnableContainer = document.querySelector(".pikminSpawnable");

//pulls the modal menus created in the HTML for use in the .js
let levelCompleteModal = new bootstrap.Modal(document.getElementById('levelCompleteModal'));
let howToPlayMenu = new bootstrap.Modal(document.getElementById('rulesPrompt'));

//gets context to the canvas so you can draw and erase on the canvas
let ctx = canvas.getContext('2d');

//declare strings to store objects on the canvas

let pikminObjects = []; //stores all Pikmin on the canvas
let staticObjects = []; //stores all static objects on the canvas (should just be the Pikmin Spawner)
let spawnTokenObjects = []; //stores all Spawn Tokens on the canvas
let pikminRetrieved = []; //stores all the Pikmin that are following the mouse cursor
let enemyObjects = []; //stores all the Enemies on the canvas
let shipPartObjects = []; //stores all the Ship Parts on the canvas

let mouseX = 0, mouseY = 0; //stores the x and y coordinates of the mouse's current location on the canvas
let objectRadius = 20; //declares the object radius in which to draw and erase objects
let spawnLimit = 1; //sets the amount of Pikmin spawnable by the player at the given time (1 by default)
let redPikminCount = 0; //sets and displays the amount of Red Pikmin spawned into the canvas
let borderMargin = 100; //sets a border margin that is factored into the x and y coords for enemy spawns

//sets the min and max offset of the canvas in which enemies, spawn tokens, and ship parts are spawned at random positions throughout the canvas
let minOffset = 50;
let maxOffset = 200;

//sets default states
let retrieveAnimationRunning = false; //true or false depending on if the primary retrieval animation is running
let secondaryRetrieveAnimationRunning = false; //true or false depending on if the secondary retrieval animation is running
let primaryPikmin; //tracks the primary Pikmin for the primary retrieval process
let secondaryPikmin; //tracks the secondary Pikmin for the secondary retrieval process

//sets the height and widths of the canvas display
canvas.height = window.innerHeight - 10;
canvas.width = window.innerWidth;

//declares the Pikmin Spawner object
let spawnerObj =
{
    width: 50,
    height: 50,
    x: (canvas.width / 2) - 50,
    y: (canvas.height / 2) - 50,
    color: '#00ff00'
}

//pushes the spawner to the static objects array
staticObjects.push(spawnerObj);

//declares the Enemy object
let enemyObj = 
{
    color: '#800080',
    width: 50,
    height: 50,
    x: Math.random() * (canvas.width - 50 - 2 * borderMargin) + borderMargin,
    y: Math.random() * (canvas.height - 50 - 2 * borderMargin) + borderMargin,
    enemyHealth: 10,
    pikminAttacking: 0, //set to how many pikmin are trying to be sent to attack the target
    spawnLimitIncreased: false, //when set to true, the spawnLimit variable will be incremented by 10
    isFollowing: false, //when set to true, the enemy will path towards the Pikmin Spawner
    isErased: false //when set to true, the enemy object will be erased from the canvas
}

//pushes the enemy to the enemy objects array
enemyObjects.push(enemyObj);

//declares the Ship Part object
let shipPartObj =
{
    color: '#fab906',
    width: 50,
    height: 50,
    x: Math.random() * (canvas.width - 50 - 2 * borderMargin) + borderMargin,
    y: Math.random() * (canvas.height - 50 - 2 * borderMargin) + borderMargin,
    pikminStrengthRequired: 20, //the amount of Pikmin required to lift and retrieve the Ship Part
    pikminAssigned: 0, //set to how many pikmin are trying to be sent to retrieve the Ship Part
    isFollowing: false, //when set to true, the Ship Part will path towards the Pikmin Spawner
    isErased: false //when set to true, the Ship Part object will be erased from the canvas
}

//pushes the ship part object to the ship part objects array
shipPartObjects.push(shipPartObj);

//creates 10 Spawn Token objects
for (let i = 0; i < 9; i++) 
{
    let spawnTokenObj = 
    {
        color: "#00ffff",
        x: Math.random() * (canvas.width - 50 - 2 * borderMargin) + borderMargin,
        y: Math.random() * (canvas.height - 50 - 2 * borderMargin) + borderMargin,
        isClicked: false, //set to true when the spawn token was clicked by the mouse cursor at least once
        isBeingRetrieved: false, //set to true when the spawn token is being retrieved by a Pikmin
        isFollowing: false, //when set to true, the spawn token will path towards the Pikmin Spawner
        isErased: false, //when set to true, the spawn token object will be erased from the canvas
    };

    //pushes the current iterated spawn token to the spawn token objects array
    spawnTokenObjects.push(spawnTokenObj);
}

//EVENT LISTENERS

//listens for when the page content is loaded
document.addEventListener('DOMContentLoaded', function () 
{
    //disables all elements of the game level
    canvas.style.display = 'none';
    pikminContainer.style.display = 'none';
    howToPlayMenu.hide();

    //sets default volumes of the audio elements
    bgmAudio.volume = 0.1;
    mainMenuBGM.volume = 0.3;

    //pauses the game level bgm so that is doesn't play
    bgmAudio.pause();
});

//listens for when the mouse is moved by the player 
//(keeping track of this on mouse move so the Pikmin following the mouse cursor know the x and y coordinates of the mouse cursor)
canvas.addEventListener('mousemove', (e) => 
{
    let rect = canvas.getBoundingClientRect();

    //sets the mouseX and mouseY variables to the x and y coords of the mouse
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

//listens for when the mouse clicks any object on the canvas
canvas.addEventListener('click', (e) => 
{
    let rect = canvas.getBoundingClientRect();

    //gets the x and y coords of the mouse and sets it to local variables
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;

    //checks if mouse cursor was in the bounds of a spawner object from the static objects array
    staticObjects.forEach((spawnerObj) =>
    {
        //if the mouse was in bounds of the current iterated spawner object
        if (mouseX >= spawnerObj.x &&
            mouseX <= spawnerObj.x + spawnerObj.width &&
            mouseY >= spawnerObj.y &&
            mouseY <= spawnerObj.y + spawnerObj.height) 
        {
            //only executes if the player can spawn more pikmin
            if (spawnLimit > 0)
            {
                //creates and Pikmin object
                let pikminObj = 
                {
                    x: spawnerObj.x - 20,
                    y: spawnerObj.y - 20,
                    color: "#ff0000",
                    isFollowing: false,
                    isRetrieving: false,
                    isTrackingTarget: false,
                    isOwnedByPlayer: false, //set to true when the player clicks the Pikmin at least once
                    firstOffset: 50, //declares the offset position from an object the Pikmin is assigned to attack or carry
                    distance: 100,
                    angle: 0,
                    offset: getRandomOffset()
                };

                //pushes the pikmin object to the pikmin objects array and reduces the spawn limit by one
                pikminObjects.push(pikminObj);
                spawnLimit--;

                //shows the change in spawn limit on the page
                pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
            }   
        }
    });

    //checks if the mouse cursor was in the bounds of a pikmin object from the pikmin objects array
    pikminObjects.forEach((pikminObj) => 
    {
        //calculates and sets the distance between the pikmin object and the mouse cursor
        let dist = Math.hypot(pikminObj.x - clickX, pikminObj.y - clickY);

        //if the the distance calculated is less than or equal to the object's radius of 20
        if (dist <= objectRadius) 
        {
            //only executes if the pikmin object clicked is not currently following the player or retrieving something
            if (!pikminObj.isFollowing && !pikminObj.isRetrieving) 
            {
                //sets the pikmin object to follow the mouse cursor
                pikminObj.isFollowing = true;

                //sets the ownership of the pikmin to true is previously false and increments the red pikmin count
                if (pikminObj.isOwnedByPlayer == false)
                {
                    pikminObj.isOwnedByPlayer = true;
                    redPikminCount++;

                    //sends the pikmin object to the an object array that tracks the pikmin owned by the player
                    pikminRetrieved.push(pikminObj);
                }
                
                //updates the visual for red pikmin owned by the player on the web page
                redPikminContainer.innerHTML = `<h1>Red Pikmin: ${redPikminCount}</h1>`;
            }
        }
    });

    //checks if the mouse cursor was in the bounds of a spawn token object from the spawn token objects array
    spawnTokenObjects.forEach((tokenObj) =>
    {
        //calculates and sets the distance between the spawn token object and the mouse cursor
        let dist = Math.hypot(tokenObj.x - clickX, tokenObj.y - clickY);

        //if the the distance calculated is less than or equal to the object's radius of 20 AND the player has Pikmin to retrieve the object
        if (dist <= objectRadius && pikminRetrieved.length != 0) 
        {
            //checks if the token object clicked is not erased first
            //(this helps prevent the player from clicking an invisible spawn token that is no longer in play)
            if (!tokenObj.isErased)
            {
                //plays the token retrieve animation if not already running
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

                            primaryPikmin = pikminRetrieved[i];
                            tokenRetrieveAnimation();
                            return;
                        }
                    }
                }
                //plays the secondary token retrieve animation if it is not already running AND the first retrieve animation is currently running 
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

                            secondaryPikmin = pikminRetrieved[i];
                            secondaryRetrieveAnimation();
                            return;
                        }
                    }
                }  
                    
                //executes a series of movements that will send a pikmin to the spawn token clicked by the cursor
                //and will bring the token back to the spawner to up the spawn limit by the amount the token is worth (only 1 in the current build)
                function tokenRetrieveAnimation()
                {
                    let tokenOffsetX = tokenObj.x + primaryPikmin.firstOffset;
                    let tokenOffsetY = tokenObj.y;
                    
                    retrieveAnimationRunning = true;
                
                    //calls the moveToObject function to move the pikmin towards the token selected
                    moveToObject(primaryPikmin, tokenOffsetX, tokenOffsetY);
                
                    //if the pikmin has reached the spawn token location
                    if (primaryPikmin.x === tokenOffsetX && primaryPikmin.y === tokenOffsetY) 
                    {
                        //sets the token object boolean attribute isFollowing to true and the token will path to the pikmin spawner
                        tokenObj.isFollowing = true;
                    }

                    //if the token object is erased, increases the spawn limit by 1, resets object attribute booleans for reusablility,
                    //and cancels the animation frame.
                    if (tokenObj.isErased == true)
                    {
                        spawnLimit++;
                        primaryPikmin.isRetrieving = false;
                        tokenObj.isBeingRetrieved = false;
                        retrieveAnimationRunning = false;
                        cancelAnimationFrame(tokenRetrieveAnimation);
                        return;
                    }
                
                    //requests an animation frame for the parent function
                    requestAnimationFrame(tokenRetrieveAnimation);
                }

                //executes a series of movements that will send a pikmin to the spawn token clicked by the cursor
                //and will bring the token back to the spawner to up the spawn limit by the amount the token is worth (only 1 in the current build)
                function secondaryRetrieveAnimation()
                {
                    let tokenOffsetX = tokenObj.x + secondaryPikmin.firstOffset;
                    let tokenOffsetY = tokenObj.y;
                
                    secondaryRetrieveAnimationRunning = true;
                
                    //calls the moveToSecondaryToken function to move the pikmin towards the token selected
                    moveToSecondaryToken(secondaryPikmin, tokenOffsetX, tokenOffsetY);
                
                    //if the pikmin has reached the spawn token location
                    if (secondaryPikmin.x === tokenOffsetX && secondaryPikmin.y === tokenOffsetY) 
                    {
                        tokenObj.isFollowing = true;
                    }

                    //if the token object is erased, increases the spawn limit by 1, resets object attribute booleans for reusablility,
                    //and cancels the animation frame.
                    if (tokenObj.isErased == true)
                    {
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
    });

    //checks if the mouse cursor was in the bounds of an enemy object from the enemy objects array
    enemyObjects.forEach((enemy) =>
    {
        //if mouse cursor is in bounds of enemy object AND player owns any pikmin
        if (mouseX >= enemy.x &&
            mouseX <= enemy.x + enemy.width &&
            mouseY >= enemy.y &&
            mouseY <= enemy.y + enemy.height &&
            pikminRetrieved.length != 0)
        {
            let pikminFollowingPlayer = 0;

            //everytime the enemy is clicked, count how many pikmin are owned by the player and set it to a local variable
            for (let i = 0; i < pikminRetrieved.length; i++)
            {
                if (pikminRetrieved[i].isFollowing == true)
                {
                    pikminFollowingPlayer++;
                }
            }

            //if the enemy is not erased AND the pikmin following the player is greater than or equal to the enemy's health
            if (!enemy.isErased && pikminFollowingPlayer >= enemy.enemyHealth)
            {
                //iterates through each pikmin following the player
                for (let i = 0; i < pikminRetrieved.length; i++)
                {
                    if (pikminRetrieved[i].isFollowing)
                    {
                        //pikmin currently iterated is set to no longer following and is now tracking the target selected
                        pikminRetrieved[i].isTrackingTarget = true;
                        pikminRetrieved[i].isFollowing = false;
                        
                        let temp = 0;
    
                        //gets the sum of pikmin retrieved that are tracking the target and sets it to a local variabls
                        for (let i = 0; i < pikminRetrieved.length; i++)
                        {
                            if (pikminRetrieved[i].isTrackingTarget == true)
                            {
                                temp++;
                            }   
                        }
    
                        //sets the pikminAttacking attribute of enemy to that temp variable
                        enemy.pikminAttacking = temp;

                        attackEnemyAnimation();
                        
                        //runs an animation to visualize the pikmin attacking the enemy until the enemy's health hits zero
                        function attackEnemyAnimation()
                        {
                            //runs when the pikmin have reached their target
                            if (pikminRetrieved[i].x === enemy.x && pikminRetrieved[i].y === enemy.y)
                            {
                                //if the enemy has health
                                if (enemy.enemyHealth > 0)
                                {
                                    //run the orbit object function
                                    orbitObject();

                                    //if the amount of pikmin attacking is greater than or equal to the enemy's health
                                    if (enemy.pikminAttacking >= enemy.enemyHealth)
                                    {
                                        //make the enemy lose one health every second until health reaches zero
                                        let healthLossInterval = setInterval(() =>
                                        {   
                                            enemy.enemyHealth--;
                
                                            if (enemy.enemyHealth <= 0)
                                            {
                                                clearInterval(healthLossInterval);
                                            }
                
                                        }, 1000);
                                    }
                                }
                                //else if the enemy's health equal zero
                                else if (enemy.enemyHealth == 0)
                                {
                                    //set enemy to isFollowing equals true so that it paths to the pikmin spawner
                                    enemy.isFollowing = true;
                                    return;
                                }

                                return;
                            }
                            //runs if the pikmin have not yet reached their target
                            else if (pikminRetrieved[i].x != enemy.x && pikminRetrieved[i].y != enemy.y && pikminRetrieved[i].isTrackingTarget == true)
                            {
                                //runs the moveToObject function
                                moveToObject(pikminRetrieved[i], enemy.x, enemy.y);
                            }
                            
                            //requests an animation frame for the parent function
                            requestAnimationFrame(attackEnemyAnimation);
                        }
    
                        //runs an animation that makes the pikmin orbit the enemy object they're assigned to
                        function orbitObject()
                        {
                            pikminObjects.forEach(pikmin => 
                            {
                                //sets the orbiting x and y position of the pikmin if it is tracking the target
                                if (pikmin.isTrackingTarget)
                                {
                                    pikmin.angle += 0.02;
                                    pikmin.x = enemy.x + Math.cos(pikmin.angle) * pikmin.distance;
                                    pikmin.y = enemy.y + Math.cos(pikmin.angle) * pikmin.distance;
                                }
                            })
    
                            //cancels the orbit animation if the enemy's health is zero
                            if (enemy.enemyHealth == 0)
                            {
                                cancelAnimationFrame(orbitObject);
    
                                //set all pikmin to no longer tracking the target
                                for (let i = 0; i < pikminRetrieved.length; i++)
                                {
                                    pikminRetrieved[i].isTrackingTarget = false;
                                }

                                //reset the enemy's pikminAttacking attribute back to zero
                                enemy.pikminAttacking = 0;
                            }
                            //if the enemy's health is still greater than zero, request an animation frame
                            else if (enemy.enemyHealth > 0)
                            {
                                requestAnimationFrame(orbitObject);
                            }
                        }
                    }
                }
            }
        }
    });

    //checks if the mouse cursor was in the bound of a ship part object from the ship part objects array 
    shipPartObjects.forEach((part) =>
    {
        //if the mouse cursor is within the bounds of a ship part object AND there are pikmin owned by the player
        if (mouseX >= part.x &&
            mouseX <= part.x + part.width &&
            mouseY >= part.y &&
            mouseY <= part.y + part.height &&
            pikminRetrieved.length != 0)
        {
            let pikminFollowingPlayer = 0;

            //set the sum of the pikmin retrieved by the player to a local variable
            for (let i = 0; i < pikminRetrieved.length; i++)
            {
                if (pikminRetrieved[i].isFollowing == true)
                {
                    pikminFollowingPlayer++;
                }
            }

            //if the part is not erased AND the pikmin following the player is greater than or equal to the strength required to lift the ship part
            if (!part.isErased && pikminFollowingPlayer >= part.pikminStrengthRequired)
            {
                //iterates for every pikmin retrieved
                for (let i = 0; i < pikminRetrieved.length; i++)
                {
                    //if the current pikmin retrieved is following
                    if (pikminRetrieved[i].isFollowing)
                    {
                        //set the pikmin to track the target and no longer follow the mouse
                        pikminRetrieved[i].isTrackingTarget = true;
                        pikminRetrieved[i].isFollowing = false;

                        let temp = 0;
    
                        //set the sum of the pikmin retrieved by the player that are tracking the target to a local variable
                        for (let i = 0; i < pikminRetrieved.length; i++)
                        {
                            if (pikminRetrieved[i].isTrackingTarget == true)
                            {
                                temp++;
                            }   
                        }
    
                        //set the part object's pikminAssigned attribute to the local variable
                        part.pikminAssigned = temp;

                        retrieveShipPartAnimation();
    
                        //runs an animation that moves the pikmin to the ship part and brings it back to the pikmin spawner
                        function retrieveShipPartAnimation()
                        {
                            //if the pikmin have reached the ship part's x and y coordinates
                            if (pikminRetrieved[i].x === part.x && pikminRetrieved[i].y === part.y)
                            {
                                //orbit the ship part
                                orbitShipPart();

                                //if the pikmin assigned to retrieving the ship part is greater than or equal to the strength required to move the part
                                if(part.pikminAssigned >= part.pikminStrengthRequired)
                                {
                                    //set ship part's isFollowing attribute to true to make it path to the pikmin spawner
                                    part.isFollowing = true;
                                }
                                
                                return;
                            }
                            //if the pikmin have not reached the ships part's x and y coordinates
                            else if (pikminRetrieved[i].x != part.x && pikminRetrieved[i].y != part.y && pikminRetrieved[i].isTrackingTarget == true)
                            {
                                //move the pikmin to the ship part
                                moveToObject(pikminRetrieved[i], part.x, part.y);
                            }
    
                            //requests an animation frame of the parent function
                            requestAnimationFrame(retrieveShipPartAnimation);
                        }
    
                        //runs an animation that makes the pikmin orbit the ship part object they're assigned to
                        function orbitShipPart()
                        {
                            pikminObjects.forEach(pikmin => 
                            {
                                //sets the orbiting x and y position of the pikmin if it is tracking the target
                                if (pikmin.isTrackingTarget)
                                {
                                    pikmin.angle += 0.02;
                                    pikmin.x = part.x + Math.cos(pikmin.angle) * pikmin.distance;
                                    pikmin.y = part.y + Math.cos(pikmin.angle) * pikmin.distance;
                                }

                            })

                            //if the ship is erased
                            if (part.isErased)
                            {
                                //cancel the animation
                                cancelAnimationFrame(orbitShipPart);
    
                                //set each pikmin retrieved by the player to isTrackingTarget equals false
                                for (let i = 0; i < pikminRetrieved.length; i++)
                                {
                                    pikminRetrieved[i].isTrackingTarget = false;
                                }

                                //reset the pikminAssigned attribute of the ship part back to zero
                                part.pikminAssigned = 0;

                                //show the level complete modal since win condition has been met
                                levelCompleteModal.show();
                            }
                            //if the ship is not erased AND pikmin have not been clicked by the
                            else if (!part.isErased)
                            {
                                requestAnimationFrame(orbitShipPart);
                            }
                        }
                    }
                }
            }
        }
    });
});

//listens for when the play button is clicked
playButton.addEventListener('click', () =>
{

    howToPlayMenu.show();

    //removes elements of the main menu screen
    mainMenuBGM.pause();
    mainMenuBGM.style.display = 'none';
    mainMenu.style.display = 'none';
    mainSection.style.display = 'none';
  
    bgmAudio.play(); //plays the bgm for the game level
    pikminContainer.style.display = 'block'; //displays the pikmin container that shows the red pikmin count, pikmin spawnable, and how to play button
    canvas.style.display = 'block'; //displays the canvas
});

//listens for when the how to play button is clicked
howToPlayButton.addEventListener('click', () =>
{
    howToPlayMenu.show(); //shows the how to play modal
});

//END EVENT LISTENERS

//FUNCTIONS

//moves the object passed to the function to the target's x and y coordinates at a custom set speed
function moveToObject(obj, targetX, targetY, speed = 0.5) 
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

//moves the object passed to the function to the token's x and y coordinates at a custom set speed
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

//generates a random offset for the pikmin to follow the mouse cursor from
function getRandomOffset() 
{
    return Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset;
}

//updates position of following pikmin objects
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
                let speedFactor = 0.05;
                pikminObj.x += dx * speedFactor;
                pikminObj.y += dy * speedFactor;
            }
        }
    });
}

//updates position of enemy objects that are being sent to the spawner
function updateEnemyPositions()
{
    enemyObjects.forEach((enemyObj) =>
    {
        if (enemyObj.isFollowing)
        {
            let dx = spawnerObj.x - enemyObj.x;
            let dy = spawnerObj.y - enemyObj.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
    
            //when distance to spawner is less than 10
            if (distance < 10) 
            {
                //set the enemy object to no longer following and erases the enemy object
                enemyObj.isFollowing = false;
                ctx.clearRect(enemyObj.x - objectRadius, enemyObj.y - objectRadius, objectRadius * 2, objectRadius * 2);
                enemyObj.isErased = true;
                
                //increases the spawn limit only once by using the spawnLimitIncreased boolean
                if (enemyObj.spawnLimitIncreased == false)
                {
                    spawnLimit += 10;
                    enemyObj.spawnLimitIncreased = true;
                }

                return;
            }
        
            //sets the speed in which the enemy travels to the destination
            let speed = 0.5;

            //increments the enemy object's x and y coordinates
            enemyObj.x += (dx / distance) * speed;
            enemyObj.y += (dy / distance) * speed;
        }
    });
}

//updates position of ship part objects that are being sent to the spawner
function updatePartPositions()
{
    shipPartObjects.forEach((part) =>
    {
        if (part.isFollowing)
        {
            let dx = spawnerObj.x - part.x;
            let dy = spawnerObj.y - part.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
        
            //when distance to spawner is less than 10
            if (distance < 10) 
            {
                //sets the ship part to no longer following and erases the ship part object
                part.isFollowing = false;
                ctx.clearRect(part.x - objectRadius, part.y - objectRadius, objectRadius * 2, objectRadius * 2);
                part.isErased = true;

                return;
            }
        
            //sets the speed in which the ship part travels to the destination
            let speed = 0.5;

            //increments the ship part object's x and y coordinates
            part.x += (dx / distance) * speed;
            part.y += (dy / distance) * speed;
        }
    });
}

//updates position of spawn token objects that are being sent to the spawner
function updateTokenPositions()
{
    spawnTokenObjects.forEach((tokenObj) => 
    {
        if (tokenObj.isFollowing) 
        {
            let dx = spawnerObj.x - tokenObj.x;
            let dy = spawnerObj.y - tokenObj.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
        
            //when distance to spawner is less than 10
            if (distance < 10) 
            {
                //sets the spawn token to no longer following and erases the spawn token object
                tokenObj.isFollowing = false;
                ctx.clearRect(tokenObj.x - objectRadius, tokenObj.y - objectRadius, objectRadius * 2, objectRadius * 2);
                tokenObj.isErased = true;
            }
        
            //sets the speed in which the ship part travels to the destination
            let speed = 0.5;

            //increments the spawn token's x and y coordinates
            tokenObj.x += (dx / distance) * speed;
            tokenObj.y += (dy / distance) * speed;
        }
    });
}

//updates the innerHTML of the pikmin spawnable container based on teh spawnLimit variable
function updateSpawnAvailable()
{
    pikminSpawnableContainer.innerHTML = `<h1>Pikmin Spawnable: ${spawnLimit}</h1>`;
}

//draws the spawn token shape
function drawSpawnTokens()
{
    // Instead of clearing the entire canvas, just redraw the moving pikminObjects
    spawnTokenObjects.forEach(spawnTokenObj => 
    {
        //if the spawn token is not erased
        if (spawnTokenObj.isErased == false)
        {
            //redraws the spawn token
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

//draws the pikmin
function drawPikmin() 
{
    //redraws on the pikmin objects stored in pikminObjects object array
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

//draws the enemy
function drawEnemy()
{
    //if the enemy object is not erased
    if (enemyObj.isErased == false)
    {
        //redraws the enemy object
        ctx.fillStyle = enemyObj.color;
        ctx.fillRect(enemyObj.x, enemyObj.y, enemyObj.width, enemyObj.height);

        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let centerX = enemyObj.x + enemyObj.width / 2;
        let centerY = enemyObj.y + enemyObj.height / 2;

        ctx.fillText(enemyObj.enemyHealth, centerX, centerY);
    }
}

//draws the ship part
function drawShipPart()
{
    //if the ship part object is not erased
    if (shipPartObj.isErased == false)
    {
        //redraws the ship part object
        ctx.fillStyle = shipPartObj.color;
        ctx.fillRect(shipPartObj.x, shipPartObj.y, shipPartObj.width, shipPartObj.height);
    
        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    
        let centerX = shipPartObj.x + shipPartObj.width / 2;
        let centerY = shipPartObj.y + shipPartObj.height / 2;
    
        ctx.fillText(shipPartObj.pikminStrengthRequired, centerX, centerY);
    }
}

//draws all the static objects
function drawStaticObjects() 
{
    //draws the static objects (in this case, just the spawner object)
    ctx.fillStyle = spawnerObj.color;
    ctx.fillRect(spawnerObj.x, spawnerObj.y, spawnerObj.width, spawnerObj.height);
}

//draw static pikminObjects initially
drawStaticObjects();

//main loop for animation (this will update the position and redraw every object every frame of runtime)
function animate() 
{
    //update the positions of the objects
    updateObjectPositions();
    updateTokenPositions();
    updateEnemyPositions();
    updateSpawnAvailable();
    updatePartPositions();

    //clears the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //redraws the objects
    drawStaticObjects();
    drawPikmin();
    drawSpawnTokens();
    drawEnemy();
    drawShipPart();

    requestAnimationFrame(animate); //loops animation
}

animate(); // Start the animation loop