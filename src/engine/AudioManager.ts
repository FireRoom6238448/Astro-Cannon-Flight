export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private engineOsc: OscillatorNode | null = null;
    private engineGain: GainNode | null = null;
    private isEnginePlaying: boolean = false;
    
    init() {
        if (this.ctx) return; // Already initialized
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            
            // Setup engine sound
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.value = 50;
            
            // Add some noise/distortion to engine
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0; // Start muted
            
            this.engineOsc.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);
            
            this.engineOsc.start();
        } catch (e) {
            console.error('AudioContext not supported');
        }
    }
    
    setEngineThrust(isThrusting: boolean) {
        if (!this.ctx || !this.engineGain || !this.engineOsc) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const now = this.ctx.currentTime;
        
        if (isThrusting && !this.isEnginePlaying) {
            this.isEnginePlaying = true;
            this.engineGain.gain.cancelScheduledValues(now);
            this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
            this.engineGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
            this.engineOsc.frequency.linearRampToValueAtTime(80, now + 0.2);
        } else if (!isThrusting && this.isEnginePlaying) {
            this.isEnginePlaying = false;
            this.engineGain.gain.cancelScheduledValues(now);
            this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
            this.engineGain.gain.linearRampToValueAtTime(0, now + 0.3);
            this.engineOsc.frequency.linearRampToValueAtTime(40, now + 0.3);
        }
    }
    
    playExplosion() {
        if (!this.ctx || !this.masterGain) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate pink-ish noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }
        
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 1.5);
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        noiseSource.start();
    }
    
    playPowerUpSound() {
        if (!this.ctx || !this.masterGain) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        // Quick arpeggio up
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    playShieldHitSound() {
        if (!this.ctx || !this.masterGain) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now);
        
        const gain = this.ctx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }
}
