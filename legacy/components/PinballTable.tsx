'use client';

import React, { useEffect, useRef } from 'react';
import * as Matter from 'matter-js';

const PinballTable = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Matter.Engine>();
  const render = useRef<Matter.Render>();
  const runner = useRef<Matter.Runner>();
  const score = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Matter.js
    engine.current = Matter.Engine.create();
    render.current = Matter.Render.create({
      element: canvasRef.current.parentElement!,
      engine: engine.current,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: 'linear-gradient(135deg, #0d0d20, #202040)',
      },
    });

    runner.current = Matter.Runner.create();
    Matter.Runner.run(runner.current, engine.current);
    Matter.Render.run(render.current);

    // Create walls
    const walls = [
      Matter.Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
      Matter.Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
    ];

    // Create larger flippers
    const leftFlipper = Matter.Bodies.rectangle(150, 450, 150, 30, {
      isStatic: true,
      angle: -0.3,
      render: {
        fillStyle: '#00ff00',
        strokeStyle: '#00ff00',
        lineWidth: 2,
      },
    });

    const rightFlipper = Matter.Bodies.rectangle(650, 450, 150, 30, {
      isStatic: true,
      angle: 0.3,
      render: {
        fillStyle: '#00ff00',
        strokeStyle: '#00ff00',
        lineWidth: 2,
      },
    });

    // Create ball with better physics
    // Create ball with purple color
    const ball = Matter.Bodies.circle(400, 100, 15, {
      restitution: 0.9,
      friction: 0.01,
      frictionAir: 0.01,
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#ff00ff',
        lineWidth: 2,
      },
    });

    // Create improved bumpers
    const bumper1 = Matter.Bodies.circle(200, 200, 35, {
      restitution: 1.1,
      density: 0.001,
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#ff00ff',
        lineWidth: 2,
      },
    });

    const bumper2 = Matter.Bodies.circle(600, 200, 35, {
      restitution: 1.1,
      density: 0.001,
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#ff00ff',
        lineWidth: 2,
      },
    });

    // Add additional bumper
    const bumper3 = Matter.Bodies.circle(400, 300, 40, {
      restitution: 1.2,
      density: 0.001,
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#ff00ff',
        lineWidth: 2,
      },
    });

    // Add walls with better physics
    const upperWall = Matter.Bodies.rectangle(400, 0, 800, 50, {
      isStatic: true,
      render: {
        fillStyle: '#00ff00',
      },
    });

    const lowerWall = Matter.Bodies.rectangle(400, 600, 800, 50, {
      isStatic: true,
      render: {
        fillStyle: '#ff0000',
      },
    });

    const leftWall = Matter.Bodies.rectangle(0, 300, 50, 600, {
      isStatic: true,
      render: {
        fillStyle: '#00ff00',
      },
    });

    const rightWall = Matter.Bodies.rectangle(800, 300, 50, 600, {
      isStatic: true,
      render: {
        fillStyle: '#00ff00',
      },
    });

    // Add bodies to world
    Matter.World.add(engine.current.world, [
      upperWall,
      lowerWall,
      leftWall,
      rightWall,
      leftFlipper,
      rightFlipper,
      ball,
      bumper1,
      bumper2,
      bumper3,
    ]);

    // Add bodies to world
    Matter.World.add(engine.current.world, [...walls, leftFlipper, rightFlipper, ball, bumper1, bumper2]);

    // Add event listeners for controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        Matter.Body.rotate(leftFlipper, 0.1);
      } else if (e.key === 'ArrowRight') {
        Matter.Body.rotate(rightFlipper, -0.1);
      } else if (e.key === ' ') {
        Matter.Body.setPosition(ball, { x: 400, y: 100 });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setVelocity(ball, { x: Math.random() * 10 - 5, y: 10 });
      } else if (e.key === 'F5') {
        score.current = 0;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        Matter.Body.rotate(leftFlipper, -0.1);
      } else if (e.key === 'ArrowRight') {
        Matter.Body.rotate(rightFlipper, 0.1);
      }
    };

    // Add improved collision detection
    Matter.Events.on(engine.current, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === ball || pair.bodyB === ball) {
          // Increase score based on collision object
          const otherBody = pair.bodyA === ball ? pair.bodyB : pair.bodyA;
          if (otherBody === bumper1 || otherBody === bumper2 || otherBody === bumper3) {
            score.current += 20; // More points for bumpers
          } else {
            score.current += 10;
          }
        }
      });
    });

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      Matter.Render.stop(render.current);
      Matter.Runner.stop(runner.current);
    };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvasRef} />
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold">
        Score: {score.current}
      </div>
    </div>
  );
};

export default PinballTable;
