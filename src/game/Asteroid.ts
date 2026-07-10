import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameObject } from '../engine/Engine';

export class Asteroid implements GameObject {
    mesh: THREE.Object3D;
    body: CANNON.Body;
    
    constructor(position: THREE.Vector3, radius: number) {
        // Create an irregular asteroid shape
        const detail = 2; // Increased detail for better lighting
        const geometry = new THREE.IcosahedronGeometry(radius, detail);
        
        // Displace vertices to make it look like an asteroid
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            vertex.normalize().multiplyScalar(radius + (Math.random() - 0.5) * radius * 0.5);
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ 
            color: 0x444444, // Darker base color
            roughness: 0.9,
            metalness: 0.3,
            flatShading: true // Gives a low-poly but realistic rocky look
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Physics body
        const shape = new CANNON.Sphere(radius);
        
        this.body = new CANNON.Body({
            mass: Math.pow(radius, 3) * 10, // Mass depends on volume (r^3)
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        });

        // Give it some random initial rotation
        this.body.angularVelocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        this.body.velocity.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        (this.body as any).gameObject = this;
    }
}
