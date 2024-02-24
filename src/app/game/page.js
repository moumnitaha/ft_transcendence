"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

const drawNet = (canvas) => {
  const net = {
    width: 2,
    height: 20,
    x: canvas.width / 2 - 2 / 2,
    y: 0,
    color: "#F5F5F5",
  };
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.rect(
      net.x,
      net.y + i * (net.height + (canvas.height - net.height * 12) / 11),
      net.width,
      net.height
    ); // 6 spaces between 7 blocks
    ctx.fillStyle = net.color;
    ctx.fill();
    ctx.closePath();
  }
  //   ctx.beginPath();
  //   //horizontal line
  //   ctx.moveTo(0, canvas.height / 2);
  //   ctx.lineTo(canvas.width, canvas.height / 2);
  //   ctx.strokeStyle = net.color;
  //   ctx.lineWidth = 2;
  //   ctx.stroke();
  //   ctx.closePath();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(6 182 212)";
  ctx.fill();
  ctx.strokeStyle = net.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = net.color;
  ctx.fill();
  ctx.closePath();
};

const drawBall = (ctx, ball) => {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.shadowBlur = 12.5;
  ctx.shadowColor = "#777";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

export default function Game() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 12,
      dx: 6,
      dy: 6,
      color: "#F5F5F5",
      get top() {
        return this.y - this.radius;
      },
      get bottom() {
        return this.y + this.radius;
      },
      get left() {
        return this.x - this.radius;
      },
      get right() {
        return this.x + this.radius;
      },
    };
    const leftPaddle = {
      x: 10,
      y: canvas.height / 2 - 100 / 2,
      width: 20,
      height: 100,
      dx: 4.5,
      dy: 0,
      color: "#F5F5F5",
      score: 0,
      get top() {
        return this.y;
      },
      get bottom() {
        return this.y + this.height;
      },
      get front() {
        return this.x + this.width;
      },
    };
    const rightPaddle = {
      x: canvas.width - 30,
      y: canvas.height / 2 - 100 / 2,
      width: 20,
      height: 100,
      dx: 4.5,
      dy: 0,
      color: "#F5F5F5",
      score: 0,
      get top() {
        return this.y;
      },
      get bottom() {
        return this.y + this.height;
      },
      get front() {
        return this.x;
      },
    };
    const drawPaddle = (ctx, paddle) => {
      ctx.beginPath(); // Start drawing scope
      //   ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
      //border radius
      //add shadow
      ctx.shadowColor = "#333";
      ctx.shadowBlur = 25;
      if (paddle === leftPaddle) {
        ctx.shadowOffsetX = -12.5;
      } else {
        ctx.shadowOffsetX = 12.5;
      }
      ctx.fillStyle = paddle.color;
      ctx.fill(); // Fill the rectangle
      ctx.closePath(); // Stop drawing scope
      ctx.shadowOffsetX = 0;
      ctx.shadowBlur = 0;
    };
    const update = () => {
      requestAnimationFrame(update);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ball.x += ball.dx;
      ball.y += ball.dy;
      if (ball.top <= 0 || ball.bottom >= canvas.height) {
        ball.dy *= -1;
      }
      if (ball.left <= 0 || ball.right >= canvas.width) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx *= -1;
      }
      if (
        (ball.left <= leftPaddle.front &&
          ball.bottom >= leftPaddle.top &&
          ball.top <= leftPaddle.bottom) ||
        (ball.right >= rightPaddle.front &&
          ball.bottom >= rightPaddle.top &&
          ball.top <= rightPaddle.bottom)
      ) {
        //check horizontal collision with left paddle top and bottom
        if (
          ball.x <= leftPaddle.front &&
          ball.x >= leftPaddle.front - leftPaddle.width &&
          (leftPaddle.top - ball.y <= ball.radius ||
            ball.y - leftPaddle.bottom <= ball.radius)
        ) {
          // cancelAnimationFrame(interval);
          ball.dy *= -1;

          return;
        }
        //check horizontal collision with right paddle top and bottom
        if (
          ball.x >= rightPaddle.front &&
          ball.x <= rightPaddle.front + rightPaddle.width &&
          (rightPaddle.top - ball.y <= ball.radius ||
            ball.y - rightPaddle.bottom <= ball.radius)
        ) {
          // cancelAnimationFrame(interval);
          ball.dy *= -1;

          return;
        }
        //left paddle bottom edge
        if (
          ball.top <= leftPaddle.bottom &&
          ball.bottom >= leftPaddle.bottom &&
          ball.y > leftPaddle.bottom &&
          ball.x > leftPaddle.front &&
          ball.dx < 0
        ) {
          if (ball.dy < 0) ball.dy *= -1;
        }
        //right paddle bottom edge
        if (
          ball.top <= rightPaddle.bottom &&
          ball.bottom >= rightPaddle.bottom &&
          ball.y > rightPaddle.bottom &&
          ball.x < rightPaddle.front &&
          ball.dx > 0
        ) {
          if (ball.dy < 0) ball.dy *= -1;
        }
        //left paddle top edge
        if (
          ball.bottom >= leftPaddle.top &&
          ball.top <= leftPaddle.top &&
          ball.y < leftPaddle.top &&
          ball.x > leftPaddle.front &&
          ball.dx < 0
        ) {
          if (ball.dy > 0) ball.dy *= -1;
        }
        //right paddle top edge
        if (
          ball.bottom >= rightPaddle.top &&
          ball.top <= rightPaddle.top &&
          ball.y < rightPaddle.top &&
          ball.x < rightPaddle.front &&
          ball.dx > 0
        ) {
          if (ball.dy > 0) ball.dy *= -1;
        }
        if (
          (ball.dx < 0 && ball.left <= leftPaddle.front) ||
          (ball.dx > 0 && ball.right >= rightPaddle.front)
        ) {
          ball.dx *= -1;
        }
      }
      drawNet(canvas);
      drawPaddle(ctx, leftPaddle);
      drawPaddle(ctx, rightPaddle);
      drawBall(ctx, ball);
      //   drawBall(ctx, ball);
    };
    const interval = requestAnimationFrame(update);
  }, []);

  return (
    <div
      id="main"
      className="w-[100svw] h-[100svh] bg-gradient-to-t from-indigo-500 p-5"
    >
      <div className="h-20 m-5 flex justify-between">
        <div className="flex flex-row w-[30%] justify-center rounded-lg">
          <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans">
            PLAYER 1
          </div>
          <Image
            src="https://profile.intra.42.fr/images/default.png"
            alt="profile"
            className="h-20 w-20 rounded-full"
            width={120}
            height={120}
          />
        </div>
        <div className="flex flex-row bg-slate-300 w-[30%] justify-center rounded-lg">
          <div className="text-black font-bold justify-center items-center flex rounded-lg w-[50%] font-sans">
            VS
          </div>
        </div>
        <div className="flex flex-row w-[30%] justify-center rounded-lg">
          <Image
            src="https://profile.intra.42.fr/images/default.png"
            alt="profile"
            className="h-20 w-20 rounded-full"
            width={120}
            height={120}
          />
          <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans">
            PLAYER 2
          </div>
        </div>
      </div>
      <canvas
        width={720}
        height={400}
        ref={canvasRef}
        id="game"
        className="mx-auto bg-cyan-500 rounded-lg"
      ></canvas>
    </div>
  );
}
