import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameObject } from '../engine/Engine';

export enum PowerUpType {
    SHIELD,
    SPEED
}

export class PowerUp implements GameObject {
    mesh: THREE.Group;
    body: CANNON.Body;
    type: PowerUpType;
    innerMesh: THREE.Mesh;

    constructor(position: THREE.Vector3, type: PowerUpType) {
        this.type = type;
        this.mesh = new THREE.Group();

        // Visuals
        const geo = new THREE.OctahedronGeometry(1.5, 0);
        const color = type === PowerUpType.SHIELD ? 0x00ffaa : 0xffaa00;
        
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.innerMesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.8, 0), 
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 1
            })
        );

        const outerMesh = new THREE.Mesh(geo, mat);
        this.mesh.add(outerMesh);
        this.mesh.add(this.innerMesh);
        
        // Add a point light to the power-up
        const light = new THREE.PointLight(color, 2, 20);
        this.mesh.add(light);

        // Physics body
        const shape = new CANNON.Sphere(1.5);
        this.body = new CANNON.Body({
            mass: 0, // static/kinematic
            type: CANNON.Body.KINEMATIC,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        });
        this.body.collisionResponse = false; // Trigger only
        
        (this.body as any).gameObject = this;
    }

    update(dt: number) {
        this.mesh.rotation.y += dt * 2;
        this.mesh.rotation.x += dt * 1;
        this.innerMesh.rotation.y -= dt * 3;
        this.innerMesh.rotation.z += dt * 2;
    }
}
