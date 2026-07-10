import * as THREE from 'three';
import { Engine, GameObject } from './Engine';

interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
    color: THREE.Color;
}

export class ParticleSystem implements GameObject {
    mesh: THREE.Points;
    particles: Particle[] = [];
    maxParticles: number = 2000;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    
    constructor() {
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const positions = new Float32Array(this.maxParticles * 3);
        const colors = new Float32Array(this.maxParticles * 3);
        const sizes = new Float32Array(this.maxParticles);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.frustumCulled = false; // Always render
    }
    
    emit(position: THREE.Vector3, velocity: THREE.Vector3, life: number, size: number, color: THREE.Color) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push({
                position: position.clone(),
                velocity: velocity.clone(),
                life,
                maxLife: life,
                size,
                color: color.clone()
            });
        }
    }
    
    update(dt: number) {
        let aliveParticles = [];
        
        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.color.array as Float32Array;
        // const sizes = this.geometry.attributes.size.array as Float32Array; // ThreeJS standard PointsMaterial doesn't support per-vertex size directly out of the box without custom shader, but we can just use size attribute if we use a custom shader. For now we skip per-particle size in standard material, or simulate it via alpha fading.
        
        let idx = 0;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.life -= dt;
            
            if (p.life > 0) {
                aliveParticles.push(p);
                
                p.position.add(p.velocity.clone().multiplyScalar(dt));
                // Add some drag
                p.velocity.multiplyScalar(0.95);
                
                positions[idx * 3] = p.position.x;
                positions[idx * 3 + 1] = p.position.y;
                positions[idx * 3 + 2] = p.position.z;
                
                const alpha = Math.max(0, p.life / p.maxLife);
                colors[idx * 3] = p.color.r * alpha;
                colors[idx * 3 + 1] = p.color.g * alpha;
                colors[idx * 3 + 2] = p.color.b * alpha;
                
                idx++;
            }
        }
        
        this.particles = aliveParticles;
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        
        this.geometry.setDrawRange(0, idx);
    }
}
