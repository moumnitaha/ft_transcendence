// components/PingPongGame.js
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Render,
  World,
  Bodies,
  Runner,
  Events,
  Mouse,
  Body,
} from "matter-js";

const PingPongGame = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const engine = Engine.create();
    const render = Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: 720,
        height: 400,
        wireframes: false,
      },
    });

    const paddleA = Bodies.rectangle(20, render.canvas.height / 2, 20, 100, {
      isStatic: true,
    });
    paddleA.render.fillStyle = "white";
    const paddleB = Bodies.rectangle(700, render.canvas.height / 2, 20, 100, {
      isStatic: true,
    });
    paddleB.render.fillStyle = "white";
    const ball = Bodies.circle(400, 300, 15, {
      render: {
        fillStyle: "white",
      },
      //   friction: 0,
      //   frictionAir: 0,
      restitution: 1,
      velocity: { x: 0.25, y: 0.25 },
    });
    ball.render.fillStyle = "white";
    const topWall = Bodies.rectangle(0, 0, render.canvas.width * 2, 10, {
      isStatic: true,
    });
    topWall.render.fillStyle = "red";
    const bottomWall = Bodies.rectangle(0, 400, render.canvas.width * 2, 10, {
      isStatic: true,
    });
    bottomWall.render.fillStyle = "green";
    const mouseControl = Mouse.create(render.canvas);
    World.add(engine.world, [
      paddleA,
      paddleB,
      ball,
      topWall,
      bottomWall,
      mouseControl,
    ]);
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    Events.on(engine, "beforeUpdate", (event) => {
      ball.position.x += 0.5;
      ball.position.y += 0.5;
      // Bounce off the walls
      if (
        ball.position.x - ball.radius < 0 ||
        ball.position.x + ball.radius > render.options.width
      ) {
        ball.velocity.x = -ball.velocity.x;
      }

      if (
        ball.position.y - ball.radius < 0 ||
        ball.position.y + ball.radius > render.options.height
      ) {
        ball.dy = -ball.dy;
        // ball.velocity.y = -ball.velocity.y;
      }
      // Add game logic here
      // move left paddle up and down using arrow keys
      document.addEventListener("keydown", function (event) {
        if (event.keyCode === 38) {
          Body.translate(paddleA, { x: 0, y: -1 });
          // leftPaddle.position.y -= 10;
        }
        if (event.keyCode === 40) {
          Body.translate(paddleA, { x: 0, y: 1 });
          // leftPaddle.position.y += 10;
        }
      });
    });
    Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.bodyA === ball) {
          //wall collision
          if (pair.bodyB === topWall || pair.bodyB === bottomWall) {
            ball.dy = -ball.dy;
            ball.velocity.y = -ball.velocity.y;
          }
        }
      }
    });

    //check ball coalitions with walls
    //   event.pairs.forEach((pair) => {
    //     if (pair.bottomWall === ball) {
    //       Body.setVelocity(ball, { x: ball.velocity.x, y: -ball.velocity.y });
    //       // Ball collides with something
    //       // You can check for specific collisions here
    //       // For example, check if the ball hits the paddles
    //       if (pair.bodyB === paddleA || pair.bodyB === paddleB) {
    //         // Reverse the horizontal velocity of the ball
    //         Matter.Body.setVelocity(ball, {
    //           x: -ball.velocity.x,
    //           y: ball.velocity.y,
    //         });
    //       }
    //     }
    //   });
    // });
    return () => {
      Render.stop(render);
      Runner.stop(runner);
    };
  }, []);

  return <div ref={canvasRef} />;
};

export default PingPongGame;
