import {
    LineBasicMaterial, WebGLRenderer, Vector3, Color, Scene, PerspectiveCamera,
    OrthographicCamera, GridHelper, AxesHelper, AmbientLight,
    DirectionalLight, Line, BufferGeometry, Raycaster, Vector2,
    BoxGeometry, MeshStandardMaterial, Mesh, TextureLoader, DoubleSide,
    Box2, Box3, Object3D, Plane
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Wall {
    type: 'wall';
    start: Vector3;
    end: Vector3;
    angle: number;
    length: number;
    id: string;
    selected?: boolean;
    highlighted?: boolean;
}

export class Viewer {
    private container: HTMLElement;
    private renderer: WebGLRenderer;
    private scene2D: Scene;
    private scene3D: Scene;
    private camera2D: OrthographicCamera;
    private camera3D: PerspectiveCamera;
    private controls2D: OrbitControls;
    private controls3D: OrbitControls;
    private is2D: boolean = true;
    private walls: Wall[] = [];
    private wallCounter: number = 0;
    private isDrawing: boolean = false;
    private currentStartPoint: Vector3 | null = null;
    private tempLine: Line | null = null;
    private wallMeshes: Map<string, Object3D> = new Map();
    private wallLines: Map<string, Line> = new Map();
    private raycaster: Raycaster = new Raycaster();
    private mouse: Vector2 = new Vector2();
    private intersectionPlane: Plane;
    private textureLoader: TextureLoader = new TextureLoader();
    private boundaryBox: Line | null = null;
    private wallThickness: number = 0.2;
    private wallListExpanded: boolean = false;
    private wallDrawingEnabled: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;
        this.intersectionPlane = new Plane(new Vector3(0, 0, 1), 0);

        this.renderer = this.createRenderer();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.append(this.renderer.domElement);

        this.scene2D = this.createScene2D();
        this.scene3D = this.createScene3D();
        this.camera2D = this.createCamera2D();
        this.camera3D = this.createCamera3D();
        this.controls2D = this.createControls2D();
        this.controls3D = this.createControls3D();
        this.setup();
        this.animate();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        const thicknessInput = document.getElementById('wall-thickness') as HTMLInputElement;
        if (thicknessInput) {
            thicknessInput.addEventListener('input', () => {
                const val = parseFloat(thicknessInput.value);
                if (!isNaN(val) && val > 0) {
                    this.wallThickness = val;
                }
            });
        }

        document.addEventListener('wallDrawingToggle', (e: CustomEvent) => {
            this.setWallDrawingEnabled(e.detail.enabled);
        });
    }

    public setWallDrawingEnabled(enabled: boolean): void {
        this.wallDrawingEnabled = enabled;

        if (!enabled && this.isDrawing) {
            this.isDrawing = false;
            if (this.tempLine) {
                this.scene2D.remove(this.tempLine);
                this.tempLine = null;
            }
            this.currentStartPoint = null;
        }
    }

    private setup() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        this.addGridAndLights(this.scene2D);
        this.addGridAndLights(this.scene3D);
    }

    private createRenderer(): WebGLRenderer {
        const renderer = new WebGLRenderer({ antialias: true });
        return renderer;
    }

    private createScene2D(): Scene {
        const scene = new Scene();
        scene.background = new Color('white');
        return scene;
    }

    private createScene3D(): Scene {
        const scene = new Scene();
        scene.background = new Color('black');
        return scene;
    }

    private createCamera2D(): OrthographicCamera {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 100;
        const camera = new OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            1,
            100
        );
        camera.position.set(0, 0, 5);
        return camera;
    }

    private createCamera3D(): PerspectiveCamera {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const camera = new PerspectiveCamera(35, aspect, 0.1, 500);
        camera.position.set(50, 50, 50);
        camera.lookAt(0, 0, 0);
        return camera;
    }

    private createControls2D(): OrbitControls {
        const controls = new OrbitControls(this.camera2D, this.container);
        controls.enableRotate = false;
        controls.enablePan = true;
        controls.panSpeed = 2;
        controls.zoomSpeed = 1;
        controls.update();
        return controls;
    }

    private createControls3D(): OrbitControls {
        const controls = new OrbitControls(this.camera3D, this.container);
        controls.panSpeed = 2;
        controls.zoomSpeed = 1;
        controls.update();
        return controls;
    }
    private addGridAndLights(scene: Scene) {
        if (scene === this.scene2D) {
            const grid = new GridHelper(200, 100, 0x222222, 0x888888);
            grid.position.set(0, 0, 0);
            grid.rotation.x = Math.PI / 2;
            scene.add(grid);

            const boundarySize = 200;
            const boundaryZ = 0.05;
            const boundaryPoints = [
                new Vector3(-boundarySize / 2, -boundarySize / 2, boundaryZ),
                new Vector3(boundarySize / 2, -boundarySize / 2, boundaryZ),
                new Vector3(boundarySize / 2, boundarySize / 2, boundaryZ),
                new Vector3(-boundarySize / 2, boundarySize / 2, boundaryZ),
                new Vector3(-boundarySize / 2, -boundarySize / 2, boundaryZ),
            ];
            const boundaryGeometry = new BufferGeometry().setFromPoints(boundaryPoints);
            const boundaryMaterial = new LineBasicMaterial({ color: 0x1976d2, linewidth: 2 });
            this.boundaryBox = new Line(boundaryGeometry, boundaryMaterial);
            scene.add(this.boundaryBox);
        } else {
            const grid = new GridHelper(150, 150);
            scene.add(grid);
        }
        const axesHelper = new AxesHelper(2);
        scene.add(axesHelper);
        if (scene === this.scene3D) {
            const ambientLight = new AmbientLight('white', 0.5);
            scene.add(ambientLight);
            const directionalLight = new DirectionalLight('white', 1);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
        }
    }

    public setView(is2D: boolean) {
        this.is2D = is2D;
        if (is2D) {
            this.controls2D.update();
        } else {
            this.camera3D.position.set(100, 80, 100);
            this.camera3D.lookAt(0, 0, 0);
            this.controls3D.target.set(0, 0, 0);
            this.controls3D.update();
            this.update3DView();
        }
    }

    private update3DView() {
        this.wallMeshes.forEach(mesh => this.scene3D.remove(mesh));
        this.wallMeshes.clear();
        this.walls.forEach(wall => this.createWallMesh3D(wall));
    }

    private createWallMesh3D(wall: Wall) {
        const wallHeight = 3;
        const wallThickness = this.wallThickness;
        const wallLength = wall.length;
        const geometry = new BoxGeometry(wallLength, wallHeight, wallThickness);
        const texture = this.textureLoader.load('/textures/brick.jpg');
        texture.wrapS = texture.wrapT = 1000;
        texture.repeat.set(wallLength / 2, wallHeight / 2);

        const material = new MeshStandardMaterial({
            map: texture,
            side: DoubleSide,
            roughness: 0.7,
            metalness: 0.1
        });

        const mesh = new Mesh(geometry, material);
        const midPoint = new Vector3().addVectors(wall.start, wall.end).multiplyScalar(0.5);
        mesh.position.set(midPoint.x, wallHeight / 2, midPoint.y);
        mesh.rotation.y = -wall.angle;

        mesh.userData.wallId = wall.id;
        this.scene3D.add(mesh);
        this.wallMeshes.set(wall.id, mesh);
    }

    public addWall(start: Vector3, end: Vector3): Wall {
        const length = start.distanceTo(end);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const wall: Wall = {
            type: 'wall',
            start: start.clone(),
            end: end.clone(),
            angle,
            length,
            id: `wall_${this.wallCounter++}`,
            selected: false,
            highlighted: false
        };
        this.walls.push(wall);
        this.createWallMesh2D(wall);
        if (!this.is2D) {
            this.createWallMesh3D(wall);
        }
        this.updateWallList();
        return wall;
    }
    d
    private createWallMesh2D(wall: Wall) {
        const material = new LineBasicMaterial({
            color: wall.selected ? 0xff0000 : (wall.highlighted ? 0x1976d2 : 0x000000)
        });
        const points = [wall.start, wall.end];
        const geometry = new BufferGeometry().setFromPoints(points);
        const line = new Line(geometry, material);
        line.userData.wallId = wall.id;

        const wallThickness = this.wallThickness;
        const wallLength = wall.length;
        const wallGeometry = new BoxGeometry(wallLength, wallThickness, 0.01);
        const wallMaterial = new MeshStandardMaterial({
            color: wall.selected ? 0xff0000 : (wall.highlighted ? 0x00ff00 : 0xcccccc),
            side: DoubleSide
        });
        const wallMesh = new Mesh(wallGeometry, wallMaterial);

        const midPoint = new Vector3().addVectors(wall.start, wall.end).multiplyScalar(0.5);
        wallMesh.position.set(midPoint.x, midPoint.y, 0);
        wallMesh.rotation.z = wall.angle;
        wallMesh.userData.wallId = wall.id;

        this.scene2D.add(line);
        this.scene2D.add(wallMesh);
        this.wallMeshes.set(wall.id, wallMesh);
        this.wallLines.set(wall.id, line); // <-- Add this line

        this.addDimensionLabel(wall);
    }

    private onMouseMove(e: MouseEvent) {
        this.updateMousePosition(e);
        if (this.is2D) {
            if (this.wallDrawingEnabled && this.isDrawing && this.currentStartPoint) {
                const intersects = this.getIntersectionPoint();
                if (intersects) {
                    this.updateTempLine(this.currentStartPoint, intersects);
                }
            } else {
                const intersects = this.getWallIntersection();
                if (intersects.length > 0) {
                    const wallId = intersects[0].object.userData.wallId;
                    console.log('Hovering wall:', wallId);
                    this.highlightWall(wallId);
                } else {
                    this.clearWallStates();
                }
            }
        }
    }

    private onMouseDown(e: MouseEvent) {
        if (this.is2D && e.button === 0 && this.wallDrawingEnabled) {
            const intersects = this.getIntersectionPoint();
            if (intersects) {
                if (!this.isDrawing) {
                    this.isDrawing = true;
                    this.currentStartPoint = intersects;
                    this.tempLine = this.createTempLine(intersects, intersects);
                    this.scene2D.add(this.tempLine);

                    // ESC to cancel
                    window.addEventListener("keydown", this.handleEscKey);
                    // Double-click to end
                    this.lastClickTime = performance.now();
                } else {
                    const wall = this.addWall(this.currentStartPoint!, intersects);
                    this.currentStartPoint = intersects;

                    if (this.tempLine) {
                        this.scene2D.remove(this.tempLine);
                        this.tempLine.geometry.dispose();
                        (this.tempLine.material as LineBasicMaterial).dispose();
                        this.tempLine = null;
                    }

                    // Prepare new temp line
                    this.tempLine = this.createTempLine(this.currentStartPoint, this.currentStartPoint);
                    this.scene2D.add(this.tempLine);

                    // Double-click to finish
                    const now = performance.now();
                    if (now - this.lastClickTime < 300) {
                        this.endWallDrawing();
                    }
                    this.lastClickTime = now;
                }
            }
        }

        if (e.button === 2) {
            const intersects = this.getWallIntersection();
            if (intersects.length > 0) {
                const wallId = intersects[0].object.userData.wallId;
                this.selectWall(wallId);
            } else {
                this.clearWallStates();
            }
        }
    }

    private handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.endWallDrawing();
        }
    }

    private endWallDrawing() {
        this.isDrawing = false;
        if (this.tempLine) {
            this.scene2D.remove(this.tempLine);
            this.tempLine.geometry.dispose();
            (this.tempLine.material as LineBasicMaterial).dispose();
            this.tempLine = null;
        }
        this.currentStartPoint = null;
        window.removeEventListener("keydown", this.handleEscKey);
    }



    private onMouseUp(e: MouseEvent) {
        // Handle any mouse up events if needed
    }

    private createTempLine(start: Vector3, end: Vector3): Line {
        const material = new LineBasicMaterial({ color: 0x0000ff });
        const points = [start, end];
        const geometry = new BufferGeometry().setFromPoints(points);
        return new Line(geometry, material);
    }

    private updateTempLine(start: Vector3, end: Vector3) {
        if (this.tempLine) {
            const positions = this.tempLine.geometry.attributes.position;
            positions.setXYZ(0, start.x, start.y, start.z);
            positions.setXYZ(1, end.x, end.y, end.z);
            positions.needsUpdate = true;
        }
    }

    private updateMousePosition(e: MouseEvent) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
    }

    private getIntersectionPoint(): Vector3 | null {
        this.raycaster.setFromCamera(this.mouse, this.is2D ? this.camera2D : this.camera3D);
        const intersects = this.raycaster.ray.intersectPlane(this.intersectionPlane, new Vector3());
        return intersects || null;
    }

    private getWallIntersection(): any[] {
        this.raycaster.setFromCamera(this.mouse, this.is2D ? this.camera2D : this.camera3D);
        const wallObjects = Array.from(this.wallMeshes.values()).filter(obj => obj instanceof Mesh);
        return this.raycaster.intersectObjects(wallObjects);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }

    private render() {
        if (this.is2D) {
            this.controls2D.update();
            this.renderer.render(this.scene2D, this.camera2D);
        } else {
            this.controls3D.update();
            this.renderer.render(this.scene3D, this.camera3D);
        }
    }

    private onWindowResize() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 100;
        this.camera2D.left = -frustumSize * aspect / 2;
        this.camera2D.right = frustumSize * aspect / 2;
        this.camera2D.top = frustumSize / 2;
        this.camera2D.bottom = -frustumSize / 2;
        this.camera2D.updateProjectionMatrix();

        this.camera3D.aspect = aspect;
        this.camera3D.updateProjectionMatrix();
    }

    public zoomExtend() {
        if (this.is2D) {
            const positions: Vector3[] = [];
            this.walls.forEach(wall => {
                positions.push(wall.start, wall.end);
            });
            if (positions.length === 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            positions.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
            const margin = 10;
            minX -= margin; minY -= margin; maxX += margin; maxY += margin;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const width = maxX - minX;
            const height = maxY - minY;
            const aspect = this.container.clientWidth / this.container.clientHeight;
            const viewSize = Math.max(width / aspect, height);
            this.camera2D.position.set(centerX, centerY, 5);
            this.camera2D.zoom = 100 / viewSize;
            this.camera2D.updateProjectionMatrix();
            this.controls2D.target.set(centerX, centerY, 0);
            this.controls2D.update();
        } else {
            const positions: Vector3[] = [];
            this.wallMeshes.forEach(mesh => {
                if (mesh instanceof Mesh) {
                    const geometry = mesh.geometry;
                    const position = geometry.attributes.position;
                    for (let i = 0; i < position.count; i++) {
                        const vertex = new Vector3();
                        vertex.fromBufferAttribute(position, i);
                        vertex.applyMatrix4(mesh.matrixWorld);
                        positions.push(vertex);
                    }
                }
            });
            if (positions.length === 0) return;
            let min = positions[0].clone(), max = positions[0].clone();
            positions.forEach(v => {
                min.min(v);
                max.max(v);
            });
            const center = min.clone().add(max).multiplyScalar(0.5);
            const size = max.clone().sub(min);
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera3D.fov * (Math.PI / 180);
            const distance = Math.max(maxDim * 1.5, 20);
            const angle = Math.PI / 4;
            this.camera3D.position.set(
                center.x + distance * Math.sin(angle),
                center.y + distance * 0.7,
                center.z + distance * Math.cos(angle)
            );
            this.camera3D.lookAt(center);
            this.controls3D.target.copy(center);
            this.controls3D.update();
        }
    }

    private addDimensionLabel(wall: Wall) {
        const label = document.createElement('div');
        label.className = 'dimension-label';
        label.style.position = 'absolute';
        label.style.color = 'black';
        label.style.fontSize = '12px';
        label.style.pointerEvents = 'none';
        label.textContent = `${wall.length.toFixed(2)}m`;

        const midPoint = new Vector3().addVectors(wall.start, wall.end).multiplyScalar(0.5);
        const screenPosition = midPoint.project(this.camera2D);

        const x = (screenPosition.x * 0.5 + 0.5) * this.container.clientWidth;
        const y = (-screenPosition.y * 0.5 + 0.5) * this.container.clientHeight;

        label.style.left = `${x}px`;
        label.style.top = `${y}px`;

        this.container.appendChild(label);
    }

    private highlightWall(id: string) {
        this.walls.forEach(wall => {
            wall.highlighted = wall.id === id;
            this.updateWallAppearance(wall);
        });
        this.updateWallList();
    }

    private selectWall(id: string) {
        this.walls.forEach(wall => {
            wall.selected = wall.id === id;
            this.updateWallAppearance(wall);
        });
        this.updateWallList();
    }

    private clearWallStates() {
        this.walls.forEach(wall => {
            wall.selected = false;
            wall.highlighted = false;
            this.updateWallAppearance(wall);
        });
        this.updateWallList();
    }

    private updateWallAppearance(wall: Wall) {
        const mesh = this.wallMeshes.get(wall.id);
        if (mesh && mesh instanceof Mesh) {
            const material = mesh.material as MeshStandardMaterial;
            material.color.setHex(
                wall.selected ? 0xff0000 : (wall.highlighted ? 0x1976d2 : 0xcccccc)
            );
        }
        const line = this.wallLines.get(wall.id);
        if (line) {
            const lineMaterial = line.material as LineBasicMaterial;
            lineMaterial.color.setHex(
                wall.selected ? 0xff0000 : (wall.highlighted ? 0x1976d2 : 0x000000)
            );
        }
    }

    private updateWallList() {
        const wallListDiv = document.getElementById('wall-list-content');
        if (!wallListDiv) return;
        if (this.walls.length === 0) {
            wallListDiv.innerHTML = '<em>No walls</em>';
            return;
        }
        const totalLength = this.walls.reduce((sum, wall) => sum + wall.length, 0);
        const summary = `<div class='header' style='margin-bottom:8px;color:#1976d2;font-weight:bold;'>
            Total Walls: ${this.walls.length}<br>
            Total Length: ${totalLength.toFixed(2)} m
        </div>`;
        let wallHtml = '';
        const showCount = this.wallListExpanded ? this.walls.length : 2;
        this.walls.slice(0, showCount).forEach((wall, idx) => {
            const angleDeg = (wall.angle * 180 / Math.PI).toFixed(1);
            wallHtml += `<div${wall.selected ? ' style=\"font-weight:bold;color:#388e3c\"' : ''}>
                Wall ${idx + 1}: ${wall.length.toFixed(2)}m<br>
                <span style=\"font-size:12px;\">
                    Start: (${wall.start.x.toFixed(2)}, ${wall.start.y.toFixed(2)})<br>
                    End:   (${wall.end.x.toFixed(2)}, ${wall.end.y.toFixed(2)})<br>
                    Angle: ${angleDeg}&deg;
                </span>
            </div>`;
        });
        let toggleBtn = '';
        if (this.walls.length > 2) {
            toggleBtn = `<div style='margin-top:8px;text-align:center;'>
                <button id='toggle-wall-list' style='background:none;border:none;color:#1976d2;font-size:18px;cursor:pointer;'>
                    ${this.wallListExpanded ? '▲ Show less' : '▼ Show all'}
                </button>
            </div>`;
        }
        wallListDiv.innerHTML = summary + wallHtml + toggleBtn;
        const toggle = document.getElementById('toggle-wall-list');
        if (toggle) {
            toggle.onclick = () => {
                this.wallListExpanded = !this.wallListExpanded;
                this.updateWallList();
            };
        }
    }
}