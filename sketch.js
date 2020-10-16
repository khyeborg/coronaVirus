// canvas variable
let canvasWidth, canvasHeight;

// subject variables
let subjectsArray = [];
let subjectIDCounter = 0;
let subjectSize = 25;
let subjectSpeedLower = 0.5;
let subjectSpeedUpper = 2.5;

// overall subject stats variables
let numberOfUninfectedSubjects = 1000;
let numberOfContractedSubjects = 0;
let numberOfInfectedSubjects = 1;
let numberOfRecoveredSubjects = 0;
let numberOfDeadSubjects = 0;

// disease variables
let infectionRate = 10;
let infectionDistance = subjectSize;
let contractedToInfectedDurationLower = 750;
let contractedToInfectedDurationUpper = 1250;
let infectedToRecoveredDurationLower = 750;
let infectedToRecoveredDurationUpper = 1250;
let mortalityRate = 50;

let xvalueCounter = 0;
let yvalueCounter = 0;

function setup() {
   canvasWidth = windowWidth;
   canvasHeight = windowHeight;

   createCanvas(canvasWidth, canvasHeight);
   noStroke();
   imageMode(CENTER);

   for (let i = 0; i < numberOfUninfectedSubjects; i++) {
      subjectsArray.push(new Subject(subjectIDCounter, "uninfected", random(width), random(height), subjectSize, random(1000000), random(1000000)));
      subjectIDCounter++;
   }

   for (let i = 0; i < numberOfInfectedSubjects; i++) {
      subjectsArray.push(new Subject(subjectIDCounter, "infected", random(width), random(height), subjectSize, random(1000000), random(1000000)));
      subjectIDCounter++;
   }

   // create triedInfectedArray for each subject
   for (let i = 0; i < subjectsArray.length; i++) {
      subjectsArray[i].createTriedInfectedArray();
   }
}
 
function draw() {
   background(0);
   // console.log(xvalueCounter, yvalueCounter);

   for (let i = 0; i < subjectsArray.length; i++) {
      subjectsArray[i].stateColor();
      subjectsArray[i].display();
      subjectsArray[i].move();

      if (subjectsArray[i].state == "contracted") {
         subjectsArray[i].infectOthers();
      }

      if (subjectsArray[i].state == "infected") {
         subjectsArray[i].infectOthers();
         subjectsArray[i].infectedToRecoveredOrDeath();
      }

      else if (subjectsArray[i].state == "contracted") {
         subjectsArray[i].contractedToInfected();
      }
   }

   computeStats();
}
 
class Subject {
   constructor(id, state, xPos, yPos, size, xnoise, ynoise) {
      this.id = id;
      this.state = state;
      this.xPos = xPos;
      this.yPos = yPos;
      this.size = size;
      this.xnoise = xnoise;
      this.ynoise = ynoise;
      this.contractedCounter = 0;
      this.infectedCounter = 0;
      this.triedInfectedArray = [];
      this.contractedToInfectedDuration = random(contractedToInfectedDurationLower, contractedToInfectedDurationUpper);
      this.infectedToRecoveredDuration = random(infectedToRecoveredDurationLower, infectedToRecoveredDurationUpper);
      this.speed = random(subjectSpeedLower, subjectSpeedUpper);

      if (this.state == "infected") {
         this.abilityToRecover = this.recoveryOrDeath();
      }
   }

   createTriedInfectedArray() {
      for (let i = 0; i < subjectsArray.length; i++) {
         if (this.id != i) {
            this.triedInfectedArray.push("no");
         }

         else {
            this.triedInfectedArray.push("me");
         }
      }
   }

   stateColor() {
      if (this.state == "uninfected") {
         this.r = 0;
         this.g = 255;
         this.b = 0;
      }

      else if (this.state == "contracted") {
         this.r = 255;
         this.g = 163;
         this.b = 0;
      }

      else if (this.state == "infected") {
         this.r = 255;
         this.g = 0;
         this.b = 0;
      }

      else if (this.state == "recovered") {
         this.r = 0;
         this.g = 0;
         this.b = 255;
      }

      fill(this.r, this.g, this.b);
   }

   display() {
      if (this.state != "dead") {
         ellipse(this.xPos, this.yPos, this.size, this.size);
      }
   }

   move() {
      // get a value between 0 and 1 from a Perlin noise graph based on xnoise
      let xvalue = noise(this.xnoise);

      // map xvalue to xmove
      let xmove = map(xvalue, 0, 1, -this.speed, this.speed);
      xvalueCounter += xmove;

      // change xPos based on xmove
      this.xPos += xmove;

      // change xnoise by a small amount
      this.xnoise += 0.01

      // get a value between 0 and 1 from a Perlin noise graph based on ynoise
      let yvalue = noise(this.ynoise);

      // map yvalue to ymove
      let ymove = map(yvalue, 0, 1, -this.speed, this.speed);
      yvalueCounter += ymove;

      // change yPos based on ymove
      this.yPos += ymove;

      // change ynoise by a small amount
      this.ynoise += 0.01

      // contain the subjects
      if (this.xPos > canvasWidth + this.size * 2) {
         this.xPos = canvasWidth + this.size * 2;
      }

      if (this.xPos < -this.size * 2) {
         this.xPos = -this.size * 2;
      }

      if (this.yPos > canvasHeight + this.size * 2) {
         this.yPos = canvasHeight + this.size * 2;
      }

      if (this.yPos < -this.size * 2) {
         this.yPos = -this.size * 2;
      }
   }

   infectOthers() {
      for (let i = 0; i < subjectsArray.length; i++) { 
         // if it's not the subject itself and the subject is state is not already contracted or infected or recovered or dead
         if (this.id != i && subjectsArray[i].state != "contracted" && subjectsArray[i].state != "infected" && subjectsArray[i].state != "recovered" && subjectsArray[i].state != "dead") {
            // if another subject touches the infected subject and no infect attempt was made 
            if (dist(this.xPos, this.yPos, subjectsArray[i].xPos, subjectsArray[i].yPos) <= infectionDistance && this.triedInfectedArray[i] == "no") {
               this.triedInfectedArray[i] = "yes";
               let num = random(100);

               if (num < infectionRate) {
                  subjectsArray[i].state = "contracted";
               }
            }
         }
      }
   }

   contractedToInfected() {
      this.contractedCounter++; 

      if (this.contractedCounter >= this.contractedToInfectedDuration) {
         this.state = "infected";
         this.contractedCounter = 0;
         this.recoveryOrDeath();
      }
   }

   infectedToRecoveredOrDeath() {
      this.infectedCounter++;

      if (this.abilityToRecover == "yes") {
         if (this.infectedCounter >= this.infectedToRecoveredDuration) {
            this.state = "recovered";
         }
      }

      else if (this.abilityToRecover == "no") {
         if (this.infectedCounter >= this.infectedToRecoveredDuration) {
            this.state = "dead";
            numberOfDeadSubjects++;
         }
      }
   }

   recoveryOrDeath() {
      let num = random(100);

      if (num < mortalityRate) {
         this.abilityToRecover = "no";
      }

      else {
         this.abilityToRecover = "yes";
      }

      return this.abilityToRecover;
   }
}

function computeStats() {
   numberOfUninfectedSubjects = 0;
   numberOfContractedSubjects = 0;
   numberOfInfectedSubjects = 0;
   numberOfRecoveredSubjects = 0;

   for (let i = 0; i < subjectsArray.length; i++) {
      if (subjectsArray[i].state == "uninfected") {
         numberOfUninfectedSubjects++;
      }

      else if (subjectsArray[i].state == "contracted") {
         numberOfContractedSubjects++;
      }

      else if (subjectsArray[i].state == "infected") {
         numberOfInfectedSubjects++;
      }

      else if (subjectsArray[i].state == "recovered") {
         numberOfRecoveredSubjects++;
      }
   }

   console.log("Uninfected:", numberOfUninfectedSubjects);
   console.log("Contracted:", numberOfContractedSubjects);
   console.log("Infected:", numberOfInfectedSubjects);
   console.log("Recovered:", numberOfRecoveredSubjects);
   console.log("Dead:", numberOfDeadSubjects);
}
