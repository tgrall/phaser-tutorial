import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Octocat extends Scene
{
    // Score counters
    private commitsCount: number = 0;
    private deploymentsCount: number = 0;
    private bugsCount: number = 0;

    // UI elements
    private commitsText!: Phaser.GameObjects.Text;
    private deploymentsText!: Phaser.GameObjects.Text;
    private bugsText!: Phaser.GameObjects.Text;

    // Game objects
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private filesGroup!: Phaser.Physics.Arcade.Group;
    private deploymentsGroup!: Phaser.Physics.Arcade.Group;
    private bugsGroup!: Phaser.Physics.Arcade.Group;
    private octocat!: Phaser.Physics.Arcade.Sprite;

    // Configuration
    private respawnEnabled: boolean = false;

    constructor()
    {
        super('Octocat');
    }

    preload() {
        this.load.setPath('assets/mona');

        this.load.image('bg-github', 'bg-code-planet.png');
        this.load.image('ground-github', 'platform-contributions.png');
        this.load.spritesheet('octocat2', 'octocat2.png', { frameWidth: 95, frameHeight: 100 });
    }

    create()
    {

        this.platforms = this.physics.add.staticGroup();
        this.add.image(512, 384, 'bg-github');
        
        // Adjusted positions for 1024x768 screen
        this.platforms.create(512, 736, 'ground-github').setScale(2.5).refreshBody();
        this.platforms.create(650, 550, 'ground-github');
        this.platforms.create(120, 450, 'ground-github');
        this.platforms.create(650, 300, 'ground-github');   

        this.octocat = this.physics.add.sprite(250, 100, 'octocat2');

        this.octocat.setScale(0.8);
        this.octocat.setBounce(0.2);
        this.octocat.setCollideWorldBounds(true);

        this.anims.create({
            key: 'octocat-left',
            frames: [ { key: 'octocat2', frame: 3 } ],
            frameRate: 10,
            repeat: -1
        }); 


        this.anims.create({
            key: 'octocat-turn',
            frames: [ { key: 'octocat2', frame: 0 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'octocat-right',
            frames: [ { key: 'octocat2', frame: 2 } ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'octocat-jump',
            frames: [ { key: 'octocat2', frame: 1 } ],
            frameRate: 20
        });

        this.cursors = this.input.keyboard!.createCursorKeys();

        // Create three types of collectibles
        this.createFiles();
        this.createDeployments();
        this.createBugs();

        // Create three score displays horizontally at the top
        this.commitsText = this.add.text(16, 16, 'Commits: 0', { fontSize: '28px', color: '#00ff00' });
        this.deploymentsText = this.add.text(280, 16, 'Deployments: 0', { fontSize: '28px', color: '#0080ff' });
        this.bugsText = this.add.text(620, 16, 'Bugs: 0', { fontSize: '28px', color: '#ff0000' });

        // Set up physics collisions
        this.physics.add.collider(this.octocat, this.platforms);
        this.physics.add.collider(this.filesGroup, this.platforms);
        this.physics.add.collider(this.deploymentsGroup, this.platforms);
        this.physics.add.collider(this.bugsGroup, this.platforms);

        // Set up overlap handlers for collection
        this.physics.add.overlap(this.octocat, this.filesGroup, this.collectFile, undefined, this);
        this.physics.add.overlap(this.octocat, this.deploymentsGroup, this.collectDeployment, undefined, this);
        this.physics.add.overlap(this.octocat, this.bugsGroup, this.collectBug, undefined, this);
        
        EventBus.emit('current-scene-ready', this);

    
    }

    update()
    {
        if (this.cursors.up.isDown && this.octocat.body!.touching.down)
        {
            this.octocat.setVelocityY(-330);
        }

        if (this.cursors.left.isDown)
        {
            this.octocat.setVelocityX(-160);
            this.octocat.anims.play('octocat-left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.octocat.setVelocityX(160);
            this.octocat.anims.play('octocat-right', true);
        }
        else
        {
            this.octocat.setVelocityX(0);
            if (!this.octocat.body!.touching.down && this.octocat.body!.velocity.y < 0)
            {
                this.octocat.anims.play('octocat-jump', true);
            }
            else
            {
                this.octocat.anims.play('turn');
            }
        }

        // Update bug movements - add random direction changes occasionally
        this.bugsGroup.children.iterate((child) =>
        {
            const bug = child as Phaser.Physics.Arcade.Image;
            if (bug.active)
            {
                // Randomly change direction occasionally (5% chance each frame)
                if (Phaser.Math.Between(1, 100) <= 5)
                {
                    const newVelocityX = Phaser.Math.Between(-150, 150);
                    const newVelocityY = Phaser.Math.Between(-150, 150);
                    bug.setVelocity(newVelocityX, newVelocityY);
                }
            }
            return true;
        });
    }

    // Helper methods to create collectible groups
    private createFiles(): void
    {
        const count = 8;
        this.filesGroup = this.physics.add.group();

        for (let i = 0; i < count; i++)
        {
            const x = Phaser.Math.Between(50, 974);
            const file = this.filesGroup.create(x, 0, 'sourcecode') as Phaser.Physics.Arcade.Image;
            file.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            file.setScale(0.5);
            file.setData('points', 1);
        }
    }

    private createDeployments(): void
    {
        const count = 5;
        this.deploymentsGroup = this.physics.add.group();

        for (let i = 0; i < count; i++)
        {
            const x = Phaser.Math.Between(50, 974);
            const deployment = this.deploymentsGroup.create(x, 0, 'deployment') as Phaser.Physics.Arcade.Image;
            deployment.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            deployment.setScale(0.5);
            deployment.setData('points', 5);
        }
    }

    private createBugs(): void
    {
        const count = 2;
        this.bugsGroup = this.physics.add.group();

        for (let i = 0; i < count; i++)
        {
            const x = Phaser.Math.Between(50, 974);
            const y = Phaser.Math.Between(100, 400);
            const bug = this.bugsGroup.create(x, y, 'bug') as Phaser.Physics.Arcade.Image;
            bug.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            bug.setBounceX(Phaser.Math.FloatBetween(0.4, 0.8));
            bug.setScale(0.5);
            bug.setData('points', 10);
            bug.setCollideWorldBounds(true);
            
            // Set random velocity for each bug
            const velocityX = Phaser.Math.Between(-150, 150);
            const velocityY = Phaser.Math.Between(-150, 150);
            bug.setVelocity(velocityX, velocityY);
        }
    }

    // Collection handlers
    private collectFile(_octocat: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody, file: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void
    {
        const fileSprite = file as Phaser.Physics.Arcade.Image;
        const points = fileSprite.getData('points') as number;
        
        fileSprite.disableBody(true, true);
        
        this.commitsCount += points;
        this.commitsText.setText(`Commits: ${this.commitsCount}`);

        // Check if all files collected and respawn if enabled
        if (this.filesGroup.countActive(true) === 0 && this.respawnEnabled)
        {
            this.createFiles();
        }
    }

    private collectDeployment(_octocat: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody, deployment: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void
    {
        const deploymentSprite = deployment as Phaser.Physics.Arcade.Image;
        const points = deploymentSprite.getData('points') as number;
        
        deploymentSprite.disableBody(true, true);
        
        this.deploymentsCount += points;
        this.deploymentsText.setText(`Deployments: ${this.deploymentsCount}`);

        // Check if all deployments collected and respawn if enabled
        if (this.deploymentsGroup.countActive(true) === 0 && this.respawnEnabled)
        {
            this.createDeployments();
        }
    }

    private collectBug(_octocat: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody, bug: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void
    {
        const bugSprite = bug as Phaser.Physics.Arcade.Image;
        const points = bugSprite.getData('points') as number;
        
        bugSprite.disableBody(true, true);
        
        this.bugsCount += points;
        this.bugsText.setText(`Bugs: ${this.bugsCount}`);

        // Check if all bugs collected and respawn if enabled
        if (this.bugsGroup.countActive(true) === 0 && this.respawnEnabled)
        {
            this.createBugs();
        }
    }
}
