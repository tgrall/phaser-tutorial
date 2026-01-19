import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    private scoreText!: Phaser.GameObjects.Text;
    private score: number = 0;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private stars!: Phaser.Physics.Arcade.Group;
    private player!: Phaser.Physics.Arcade.Sprite;

    constructor()
    {
        super('Game');
    }

    preload() {
        this.load.setPath('assets/dude');
        this.load.image('sky', 'sky.png');
        this.load.image('ground', 'platform.png');
        this.load.image('bomb', 'bomb.png');
        this.load.image('star', 'star.png');
        this.load.spritesheet('dude', 'dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create()
    {
        // Scale and position sky for 1024x768 screen
        const sky = this.add.image(512, 384, 'sky');
        sky.setDisplaySize(1024, 768);

        this.platforms = this.physics.add.staticGroup();

        // Adjusted positions for 1024x768 screen
        this.platforms.create(512, 736, 'ground').setScale(2.5).refreshBody();

        this.platforms.create(650, 550, 'ground');
        this.platforms.create(100, 450, 'ground');
        this.platforms.create(700, 300, 'ground');

        this.player = this.physics.add.sprite(150, 550, 'dude');

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'dude-left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'dude-turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'dude-right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.cursors = this.input.keyboard!.createCursorKeys();

        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 62, y: 0, stepX: 80 }
        });

        this.stars.children.iterate((child) =>
        {
            const star = child as Phaser.Physics.Arcade.Image;
            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            return true;
        });

        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

        EventBus.emit('current-scene-ready', this);

    }

    update()
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);
            this.player.anims.play('dude-left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);
            this.player.anims.play('dude-right', true);
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.anims.play('dude-turn');
        }

        if (this.cursors.up.isDown && this.player.body!.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    collectStar(player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody)
    {
        const starSprite = star as Phaser.Physics.Arcade.Image;
        starSprite.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    changeScene ()
    {
        this.scene.start('Octocat');
    }


}
