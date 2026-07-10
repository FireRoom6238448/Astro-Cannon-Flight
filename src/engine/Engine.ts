import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

export interface GameObject {
    mesh?: THREE.Object3D;
    body?: CANNON.Body;
    update?: (dt: number) => void;
}

export class Engine {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    world: CANNON.World;
    objects: Set<GameObject> = new Set();
    lastTime: number = 0;
    isRunning: boolean = false;
    animationFrameId: number | null = null;
    
    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Post-processing
        const renderScene = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        bloomPass.threshold = 0.2;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;
        
        const filmPass = new FilmPass(0.35, false);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
        this.composer.addPass(filmPass);

        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, 0, 0), // Zero gravity for space
        });
        
        // Add subtle fog for depth
        this.scene.fog = new THREE.FogExp2(0x050510, 0.002);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffeedd, 3);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    add(obj: GameObject) {
        this.objects.add(obj);
        if (obj.mesh) this.scene.add(obj.mesh);
        if (obj.body) this.world.addBody(obj.body);
    }
    
    remove(obj: GameObject) {
        this.objects.delete(obj);
        if (obj.mesh) {
            // Traverse and dispose geometry/materials if needed (simplified here)
            this.scene.remove(obj.mesh);
        }
        if (obj.body) {
            this.world.removeBody(obj.body);
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    private loop(time: number) {
        if (!this.isRunning) return;
        
        const dt = Math.min((time - this.lastTime) / 1000, 0.1); // Cap dt to avoid huge jumps
        this.lastTime = time;
        
        this.world.step(1 / 60, dt, 3);
        
        for (const obj of this.objects) {
            if (obj.mesh && obj.body) {
                obj.mesh.position.set(obj.body.position.x, obj.body.position.y, obj.body.position.z);
                obj.mesh.quaternion.set(obj.body.quaternion.x, obj.body.quaternion.y, obj.body.quaternion.z, obj.body.quaternion.w);
            }
            if (obj.update) {
                obj.update(dt);
            }
        }
        
        this.composer.render();
        
        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
    
    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.stop();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
    }
}
