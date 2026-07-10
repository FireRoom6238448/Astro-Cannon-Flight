import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameObject } from '../engine/Engine';
import { InputManager } from '../engine/InputManager';
import { ParticleSystem } from '../engine/ParticleSystem';
import { AudioManager } from '../engine/AudioManager';

export class Spaceship implements GameObject {
    mesh: THREE.Group;
    body: CANNON.Body;
    input: InputManager;
    camera: THREE.PerspectiveCamera;
    engineGlow: THREE.PointLight;
    particles: ParticleSystem;
    audio: AudioManager;
    
    // Power-up states
    hasShield: boolean = false;
    speedMultiplier: number = 1;
    shieldMesh: THREE.Mesh;
    private shieldTimer: any;
    private speedTimer: any;

    constructor(input: InputManager, camera: THREE.PerspectiveCamera, particles: ParticleSystem, audio: AudioManager) {
        this.input = input;
        this.camera = camera;
        this.particles = particles;
        this.audio = audio;
        this.mesh = new THREE.Group();

        // Main hull
        const hullGeo = new THREE.ConeGeometry(1, 4, 16);
        hullGeo.rotateX(-Math.PI / 2); // Point to -Z
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff, 
            roughness: 0.2, 
            metalness: 0.8 
        });
        const hullMesh = new THREE.Mesh(hullGeo, material);
        this.mesh.add(hullMesh);

        // Wings
        const wingGeo = new THREE.BoxGeometry(4, 0.2, 1);
        wingGeo.translate(0, -0.5, 1);
        const wingMesh = new THREE.Mesh(wingGeo, material);
        this.mesh.add(wingMesh);

        // Engine glow
        this.engineGlow = new THREE.PointLight(0xff4400, 0, 30);
        this.engineGlow.position.set(0, 0, 3);
        this.mesh.add(this.engineGlow);

        // Headlight to see asteroids
        const frontLight = new THREE.SpotLight(0xffffff, 500, 400, Math.PI / 3, 0.5, 1);
        frontLight.position.set(0, 0, 0);
        frontLight.target.position.set(0, 0, -10);
        this.mesh.add(frontLight);
        this.mesh.add(frontLight.target);

        // Shield visuals
        const shieldGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            wireframe: true,
            visible: false
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.mesh.add(this.shieldMesh);

        // Physics body
        const boxShape = new CANNON.Box(new CANNON.Vec3(2, 1, 2));

        this.body = new CANNON.Body({
            mass: 500, // Heavier
            shape: boxShape,
            position: new CANNON.Vec3(0, 0, 0),
            linearDamping: 0.1, // Less damping, more floaty
            angularDamping: 0.7,
        });
        
        (this.body as any).gameObject = this;
    }

    activateShield() {
        this.hasShield = true;
        this.shieldMesh.visible = true;
        if (this.shieldTimer) clearTimeout(this.shieldTimer);
        this.shieldTimer = setTimeout(() => {
            this.deactivateShield();
        }, 5000);
    }

    deactivateShield() {
        this.hasShield = false;
        this.shieldMesh.visible = false;
    }

    activateSpeedBoost() {
        this.speedMultiplier = 2.5;
        if (this.speedTimer) clearTimeout(this.speedTimer);
        this.speedTimer = setTimeout(() => {
            this.speedMultiplier = 1;
        }, 5000);
    }

    update(dt: number) {
        const thrust = 35000 * this.speedMultiplier; // Increased to match new mass
        const turnSpeed = 15000;

        // Use Three.js Math for easier vector manipulation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.mesh.quaternion);

        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.mesh.quaternion);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.mesh.quaternion);

        let isThrusting = false;

        // Thrust
        if (this.input.isKeyPressed('KeyW') || this.input.isKeyPressed('ArrowUp')) {
            const force = forward.clone().multiplyScalar(thrust);
            this.body.applyForce(new CANNON.Vec3(force.x, force.y, force.z), new CANNON.Vec3(0, 0, 0));
            isThrusting = true;
            
            // Emit exhaust particles
            const exhaustPos = this.mesh.position.clone().add(forward.clone().multiplyScalar(-3));
            const exhaustVel = forward.clone().multiplyScalar(-20).add(
                new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5)
            );
            this.particles.emit(exhaustPos, exhaustVel, 0.5, 2.0, new THREE.Color(0xffaa00));
        }
        if (this.input.isKeyPressed('KeyS') || this.input.isKeyPressed('ArrowDown')) {
            const force = forward.clone().multiplyScalar(-thrust * 0.5);
            this.body.applyForce(new CANNON.Vec3(force.x, force.y, force.z), new CANNON.Vec3(0, 0, 0));
        }
        
        this.audio.setEngineThrust(isThrusting);

        // Engine glow effect
        this.engineGlow.intensity = isThrusting ? 8 + Math.random() * 4 : 0;

        // Rotation (Pitch, Yaw, Roll)
        const torque = new THREE.Vector3(0, 0, 0);
        
        // Pitch
        if (this.input.isKeyPressed('KeyQ')) {
            torque.add(right.clone().multiplyScalar(-turnSpeed));
        }
        if (this.input.isKeyPressed('KeyE')) {
            torque.add(right.clone().multiplyScalar(turnSpeed));
        }

        // Yaw and Roll (Banking)
        if (this.input.isKeyPressed('KeyA') || this.input.isKeyPressed('ArrowLeft')) {
            torque.add(up.clone().multiplyScalar(turnSpeed));
            torque.add(forward.clone().multiplyScalar(turnSpeed * 1.5)); // Roll
        }
        if (this.input.isKeyPressed('KeyD') || this.input.isKeyPressed('ArrowRight')) {
            torque.add(up.clone().multiplyScalar(-turnSpeed));
            torque.add(forward.clone().multiplyScalar(-turnSpeed * 1.5)); // Roll
        }

        this.body.applyTorque(new CANNON.Vec3(torque.x, torque.y, torque.z));

        // Camera follow logic - Fixed glitchiness by using stable tracking points
        const idealOffset = new THREE.Vector3(0, 5, 20); // Behind and above
        idealOffset.applyQuaternion(this.mesh.quaternion);
        idealOffset.add(this.mesh.position);

        const lookAtOffset = new THREE.Vector3(0, 0, -100);
        lookAtOffset.applyQuaternion(this.mesh.quaternion);
        lookAtOffset.add(this.mesh.position);
        
        // Frame-independent smooth follow
        const t = 1.0 - Math.pow(0.001, dt);

        this.camera.position.lerp(idealOffset, t);
        
        // Smoothly interpolate look target rather than slerping quaternion
        if (!(this as any).cameraLookTarget) {
            (this as any).cameraLookTarget = lookAtOffset.clone();
        }
        (this as any).cameraLookTarget.lerp(lookAtOffset, t * 1.5); // Look at updates slightly faster
        this.camera.up.copy(up); // Align camera up with ship up to prevent flipping
        this.camera.lookAt((this as any).cameraLookTarget);
    }
}
