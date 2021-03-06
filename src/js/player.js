import Phaser from "phaser";
import Button from "./Button.js";
import MultiKey from "./multi-key.js";

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.height = this.scene.game.config.height;
    this.width = this.scene.game.config.width;
    this.jumpButtonPressed = false;

    // Create the animations we need from the player spritesheet
    const anims = scene.anims;
    anims.create({
      key: "player-idle",
      frames: anims.generateFrameNumbers("templatePlayer", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: -1,
    });
    anims.create({
      key: "player-run",
      frames: anims.generateFrameNumbers("templatePlayer", {
        start: 4,
        end: 7,
      }),
      frameRate: 12,
      repeat: -1,
    });

    // Create the physics-based sprite that we will move around and animate
    this.sprite = scene.matter.add.sprite(0, 0, "templatePlayer", 0);

    // The player's body is going to be a compound body that looks something like this:
    //
    //                  A = main body
    //
    //                   +---------+
    //                   |         |
    //                 +-+         +-+
    //       B = left  | |         | |  C = right
    //    wall sensor  |B|    A    |C|  wall sensor
    //                 | |         | |
    //                 +-+         +-+
    //                   |         |
    //                   +-+-----+-+
    //                     |  D  |
    //                     +-----+
    //
    //                D = ground sensor
    //
    // The main body is what collides with the world. The sensors are used to determine if the
    // player is blocked by a wall or standing on the ground.

    const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
    const { width: w, height: h } = this.sprite;
    const mainBody = Bodies.rectangle(w / 2, h / 2, w * 0.6, h, {
      chamfer: { radius: 10 },
    });
    this.sensors = {
      bottom: Bodies.rectangle(w / 2, h, w * 0.25, 2, { isSensor: true }),
      left: Bodies.rectangle(w * 0.15, h / 2, 2, h * 0.5, {
        isSensor: true,
      }),
      right: Bodies.rectangle(w * 0.85, h / 2, 2, h * 0.5, {
        isSensor: true,
      }),
    };
    const compoundBody = Body.create({
      parts: [
        mainBody,
        this.sensors.bottom,
        this.sensors.left,
        this.sensors.right,
      ],
      frictionStatic: 0,
      frictionAir: 0.02,
    });
    this.sprite
      .setExistingBody(compoundBody)
      .setScale(2)
      .setFixedRotation() // Sets inertia to infinity so the player can't rotate
      .setPosition(x, y);

    // Track which sensors are touching something
    this.isTouching = { left: false, right: false, ground: false };

    // Jumping is going to have a cooldown
    this.canJump = true;
    this.jumpCooldownTimer = null;

    // Before matter's update, reset the player's count of what surfaces it is touching.
    scene.matter.world.on("beforeupdate", this.resetTouching, this);

    scene.matterCollision.addOnCollideStart({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this,
    });
    scene.matterCollision.addOnCollideActive({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this,
    });

    const { LEFT, RIGHT, UP, DOWN, A, D, W, S } =
      Phaser.Input.Keyboard.KeyCodes;
    this.leftInput = new MultiKey(scene, [LEFT, A]);
    this.rightInput = new MultiKey(scene, [RIGHT, D]);
    this.jumpInput = new MultiKey(scene, [UP, W]);
    this.crouchInput = new MultiKey(scene, [DOWN, S]);

    this.destroyed = false;
    this.scene.events.on("update", this.update, this);
    this.scene.events.once("shutdown", this.destroy, this);
    this.scene.events.once("destroy", this.destroy, this);

    this.joyStick = this.scene.rexVirtualJoystick
      .add(this.scene, {
        x: 60,
        y: this.height - 60,
        radius: 50,
        base: this.scene.add.circle(0, 0, 40, 0x888888, 0.5),
        thumb: this.scene.add.circle(0, 0, 20, 0xcccccc, 0.8),
        dir: 1, // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
        forceMin: 16,
      })
      .on("update", this.updateJoyStickState, this);

    this.updateJoyStickState();

    this.button = new Button(
      this.width - 60,
      this.height - 60,
      "A",
      this.scene,
      () => (this.jumpButtonPressed = true),
    );
  }

  updateJoyStickState() {
    const cursorKeys = this.joyStick.createCursorKeys();
    this.joyStickLeft = cursorKeys.left.isDown;
    this.joyStickRight = cursorKeys.right.isDown;
  }

  onSensorCollide({ bodyA, bodyB, pair }) {
    // Watch for the player colliding with walls/objects on either side and the ground below, so
    // that we can use that logic inside of update to move the player.
    // Note: we are using the "pair.separation" here. That number tells us how much bodyA and bodyB
    // overlap. We want to teleport the sprite away from walls just enough so that the player won't
    // be able to press up against the wall and use friction to hang in midair. This formula leaves
    // 0.5px of overlap with the sensor so that the sensor will stay colliding on the next tick if
    // the player doesn't move.
    if (bodyB.isSensor) return; // We only care about collisions with physical objects
    if (bodyA === this.sensors.left) {
      this.isTouching.left = true;
      if (pair.separation > 0.5) this.sprite.x += pair.separation - 0.5;
    } else if (bodyA === this.sensors.right) {
      this.isTouching.right = true;
      if (pair.separation > 0.5) this.sprite.x -= pair.separation - 0.5;
    } else if (bodyA === this.sensors.bottom) {
      this.isTouching.ground = true;
    }
  }

  resetTouching() {
    this.isTouching.left = false;
    this.isTouching.right = false;
    this.isTouching.ground = false;
  }

  freeze() {
    this.sprite.setStatic(true);
  }

  update() {
    if (this.destroyed) return;

    const sprite = this.sprite;
    const velocity = sprite.body.velocity;
    const isRightKeyDown = this.rightInput.isDown() || this.joyStickRight;
    const isLeftKeyDown = this.leftInput.isDown() || this.joyStickLeft;
    const isJumpKeyDown = this.jumpInput.isDown() || this.jumpButtonPressed;
    const isCrouchKeyDown = this.crouchInput.isDown();
    const isOnGround = this.isTouching.ground;
    const isInAir = !isOnGround;

    // --- Move the player horizontally ---

    // Adjust the movement so that the player is slower in the air
    const moveForce = isOnGround ? 0.01 : 0.005;

    if (isLeftKeyDown) {
      sprite.setFlipX(true);

      // Don't let the player push things left if they in the air
      if (!(isInAir && this.isTouching.left)) {
        sprite.applyForce({ x: -moveForce, y: 0 });
      }
    } else if (isRightKeyDown) {
      sprite.setFlipX(false);

      // Don't let the player push things right if they in the air
      if (!(isInAir && this.isTouching.right)) {
        sprite.applyForce({ x: moveForce, y: 0 });
      }
    }

    // Limit horizontal speed, without this the player's velocity would just keep increasing to
    // absurd speeds. We don't want to touch the vertical velocity though, so that we don't
    // interfere with gravity.
    if (velocity.x > 7) sprite.setVelocityX(7);
    else if (velocity.x < -7) sprite.setVelocityX(-7);

    // --- Move the player vertically ---

    if (isJumpKeyDown && this.canJump && isOnGround) {
      sprite.setVelocityY(-11);

      // Add a slight delay between jumps since the bottom sensor will still collide for a few
      // frames after a jump is initiated
      this.canJump = false;
      this.jumpCooldownTimer = this.scene.time.addEvent({
        delay: 250,
        callback: () => (this.canJump = true),
      });
    }

    if (isOnGround) {
      // Update the animation/texture based on the state of the player's state
      if (sprite.body.force.x !== 0) sprite.anims.play("player-run", true);
      else if (isCrouchKeyDown && velocity.x < 1) {
        sprite.anims.stop();
        sprite.setTexture("templatePlayer", 3);
      } else sprite.anims.play("player-idle", true);
    } else {
      if (sprite.body.velocity.y > 0) {
        sprite.setTexture("templatePlayer", 9);
      } else {
        sprite.setTexture("templatePlayer", 8);
      }
    }
    this.jumpButtonPressed = false;
  }

  destroy() {
    // Clean up any listeners that might trigger events after the player is officially destroyed
    this.scene.events.off("update", this.update, this);
    this.scene.events.off("shutdown", this.destroy, this);
    this.scene.events.off("destroy", this.destroy, this);
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }
    const sensors = [
      this.sensors.bottom,
      this.sensors.left,
      this.sensors.right,
    ];
    this.scene.matterCollision.removeOnCollideStart({ objectA: sensors });
    this.scene.matterCollision.removeOnCollideActive({ objectA: sensors });
    if (this.jumpCooldownTimer) this.jumpCooldownTimer.destroy();

    this.destroyed = true;
    this.sprite.destroy();
  }
}
