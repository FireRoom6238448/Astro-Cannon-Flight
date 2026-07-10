import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Engine } from '../engine/Engine';
import { InputManager } from '../engine/InputManager';
import { Spaceship } from './Spaceship';
import { Asteroid } from './Asteroid';
import { PowerUp, PowerUpType } from './PowerUp';
import { AudioManager } from '../engine/AudioManager';
import { ParticleSystem } from '../engine/ParticleSystem';

export class Game {
    engine: Engine;
    input: InputManager;
    spaceship: Spaceship;
    asteroids: Asteroid[] = [];
    powerUps: PowerUp[] = [];
    isGameOver: boolean = false;
    score: number = 0;
    audio: AudioManager;
    particles: ParticleSystem;
    
    // Callbacks for UI
    onScoreUpdate?: (score: number) => void;
    onGameOver?: () => void;

    constructor(canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas);
        this.input = new InputManager();
        this.audio = new AudioManager();
        
        // Ensure audio starts on first interaction
        const startAudio = () => {
            this.audio.init();
            window.removeEventListener('keydown', startAudio);
            window.removeEventListener('touchstart', startAudio);
            window.removeEventListener('mousedown', startAudio);
        };
        window.addEventListener('keydown', startAudio);
        window.addEventListener('touchstart', startAudio);
        window.addEventListener('mousedown', startAudio);

        this.particles = new ParticleSystem();
        this.engine.add(this.particles);

        // Create spaceship
        this.spaceship = new Spaceship(this.input, this.engine.camera, this.particles, this.audio);
        this.engine.add(this.spaceship);

        // Add some starry background
        this.createStars();

        // Generate initial asteroids
        this.generateAsteroidField();
        
        // Generate powerups
        this.generatePowerUps();

        // Detect collisions
        this.spaceship.body.addEventListener('collide', this.handleCollision.bind(this));

        // Create a game logic update loop (not tied to rendering frame directly but called in loop?
        // Let's add a custom update object to engine just for Game logic
        this.engine.add({
            update: this.update.bind(this)
        });

        this.engine.start();
    }

    private createStars() {
        const geometry = new THREE.BufferGeometry();
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorPalette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xaaaaaa),
            new THREE.Color(0x88ccff),
            new THREE.Color(0xffcc88)
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

            const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({ 
            size: 2, 
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        const stars = new THREE.Points(geometry, material);
        
        // Add just visual
        this.engine.scene.add(stars);
    }

    private generateAsteroidField() {
        const asteroidCount = 300;
        const fieldSize = 400;

        for (let i = 0; i < asteroidCount; i++) {
            // Random position, avoiding the immediate starting area
            let position;
            do {
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * fieldSize,
                    (Math.random() - 0.5) * fieldSize,
                    (Math.random() - 0.5) * fieldSize
                );
            } while (position.length() < 30); // Keep start clear

            const radius = 2 + Math.random() * 8;
            const asteroid = new Asteroid(position, radius);
            this.asteroids.push(asteroid);
            this.engine.add(asteroid);
        }
    }

    private generatePowerUps() {
        const count = 20;
        const fieldSize = 400;
        for (let i = 0; i < count; i++) {
            let position;
            do {
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * fieldSize,
                    (Math.random() - 0.5) * fieldSize,
                    (Math.random() - 0.5) * fieldSize
                );
            } while (position.length() < 30);
            
            const type = Math.random() > 0.5 ? PowerUpType.SHIELD : PowerUpType.SPEED;
            const pu = new PowerUp(position, type);
            this.powerUps.push(pu);
            this.engine.add(pu);
        }
    }

    private handleCollision(e: any) {
        if (this.isGameOver) return;
        
        const otherBody = e.body;
        const otherObject = otherBody.gameObject;

        if (otherObject instanceof PowerUp) {
            this.collectPowerUp(otherObject);
            return;
        }

        if (otherObject instanceof Asteroid || !otherObject) {
            if (this.spaceship.hasShield) {
                this.spaceship.deactivateShield();
                this.audio.playShieldHitSound();
                return; // Survived via shield!
            }
            
            const relativeVelocity = e.contact.ni.clone().scale(e.contact.getImpactVelocityAlongNormal());
            if (Math.abs(relativeVelocity.length()) > 5) {
                // Defer game over logic to avoid removing bodies during physics step
                setTimeout(() => this.gameOver(), 0);
            }
        }
    }

    private collectPowerUp(pu: PowerUp) {
        this.audio.playPowerUpSound();
        if (pu.type === PowerUpType.SHIELD) {
            this.spaceship.activateShield();
        } else if (pu.type === PowerUpType.SPEED) {
            this.spaceship.activateSpeedBoost();
        }
        
        // Remove power up
        this.engine.remove(pu);
        const idx = this.powerUps.indexOf(pu);
        if (idx > -1) this.powerUps.splice(idx, 1);
        
        // Visual effect for pickup
        for (let i = 0; i < 20; i++) {
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            this.particles.emit(
                pu.mesh.position.clone(),
                vel,
                0.5,
                2.0,
                pu.type === PowerUpType.SHIELD ? new THREE.Color(0x00ffaa) : new THREE.Color(0xffaa00)
            );
        }
    }

    private gameOver() {
        this.isGameOver = true;
        
        // Disable spaceship input and movement
        this.engine.remove(this.spaceship);
        
        // Play audio
        this.audio.playExplosion();
        this.audio.setEngineThrust(false);
        
        // Create explosion particles
        for (let i = 0; i < 100; i++) {
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
            this.particles.emit(
                this.spaceship.mesh.position.clone(),
                vel,
                1.0 + Math.random(),
                3.0,
                new THREE.Color(Math.random() > 0.5 ? 0xff5500 : 0xffaa00)
            );
        }
        
        if (this.onGameOver) this.onGameOver();
    }

    update(dt: number) {
        if (this.isGameOver) return;
        
        // Score is based on distance traveled or time survived
        this.score += dt * 10;
        if (this.onScoreUpdate) {
            this.onScoreUpdate(Math.floor(this.score));
        }

        // Infinite field logic: if an asteroid is too far behind the player, move it ahead
        const playerPos = this.spaceship.mesh.position;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.spaceship.mesh.quaternion);
        
        for (const ast of this.asteroids) {
            const dist = ast.mesh.position.distanceTo(playerPos);
            // If it's too far behind
            const toAsteroid = ast.mesh.position.clone().sub(playerPos);
            if (dist > 250 || (dist > 100 && toAsteroid.dot(forward) < -50)) {
                // Reposition ahead of player
                const newDist = 150 + Math.random() * 100;
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    0
                ).applyQuaternion(this.spaceship.mesh.quaternion); // Random xy spread relative to player
                
                const newPos = playerPos.clone().add(forward.clone().multiplyScalar(newDist)).add(offset);
                
                ast.body.position.set(newPos.x, newPos.y, newPos.z);
                ast.body.velocity.set(0, 0, 0); // Reset velocity
            }
        }
        
        for (let i = 0; i < this.powerUps.length; i++) {
            const pu = this.powerUps[i];
            const dist = pu.mesh.position.distanceTo(playerPos);
            const toPu = pu.mesh.position.clone().sub(playerPos);
            if (dist > 250 || (dist > 100 && toPu.dot(forward) < -50)) {
                const newDist = 150 + Math.random() * 100;
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    0
                ).applyQuaternion(this.spaceship.mesh.quaternion);
                
                const newPos = playerPos.clone().add(forward.clone().multiplyScalar(newDist)).add(offset);
                pu.body.position.set(newPos.x, newPos.y, newPos.z);
            }
        }
        
        if (this.powerUps.length < 10) {
            this.generatePowerUps();
        }
    }

    dispose() {
        this.engine.dispose();
        this.input.dispose();
    }
}
