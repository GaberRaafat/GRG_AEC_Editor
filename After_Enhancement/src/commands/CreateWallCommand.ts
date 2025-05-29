// File: CreateWallCommand.ts
import { Vector3, Vector2, PlaneGeometry, MeshBasicMaterial, DoubleSide, Mesh } from "three";
import type { Document2D } from "../documents/Document2D";
import type { ICommand } from "./ICommand";

export class CreateWallCommand implements ICommand {
    document: Document2D;
    points: Vector3[] = [];
    mouse: Vector2 = new Vector2();
    previewWall: Mesh | null = null;
    drawing: boolean = false;
    lastClickTime: number = 0;

    constructor(document: Document2D) {
        this.document = document;
        document.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    onMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;

        const now = performance.now();
        const newPoint = this.document.unproject(new Vector3(this.mouse.x, this.mouse.y, 0));

        if (!this.drawing) {
            this.drawing = true;
            this.points = [newPoint];
        } else {
            const lastPoint = this.points[this.points.length - 1];
            this.document.drawWall(lastPoint, newPoint);
            this.points.push(newPoint);

            if (now - this.lastClickTime < 300) {
                this.reset(); // Double-click detected
                return;
            }
        }

        this.lastClickTime = now;

        if (this.previewWall) {
            this.document.removeObject(this.previewWall);
            this.previewWall.geometry.dispose();
            this.previewWall.material.dispose();
            this.previewWall = null;
        }
    }

    onMouseMove(e: MouseEvent) {
        const rect = this.document.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (this.drawing && this.points.length > 0) {
            const currentPoint = this.document.unproject(new Vector3(this.mouse.x, this.mouse.y, 0));
            const lastPoint = this.points[this.points.length - 1];

            const wallVec = currentPoint.clone().sub(lastPoint);
            const length = wallVec.length();
            const angle = Math.atan2(wallVec.y, wallVec.x);

            const geometry = new PlaneGeometry(length, 1);
            const material = new MeshBasicMaterial({
                color: 'gray',
                transparent: true,
                opacity: 0.5,
                side: DoubleSide
            });

            if (this.previewWall) {
                this.document.removeObject(this.previewWall);
                this.previewWall.geometry.dispose();
                this.previewWall.material.dispose();
            }

            this.previewWall = new Mesh(geometry, material);
            this.previewWall.position.set(
                (lastPoint.x + currentPoint.x) / 2,
                (lastPoint.y + currentPoint.y) / 2,
                0
            );
            this.previewWall.rotation.z = angle;
            this.document.addObject(this.previewWall);
        }
    }

    onMouseUp() {
        // no-op
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            this.reset();
        }
    }

    reset() {
        this.drawing = false;
        this.points = [];
        if (this.previewWall) {
            this.document.removeObject(this.previewWall);
            this.previewWall.geometry.dispose();
            this.previewWall.material.dispose();
            this.previewWall = null;
        }
    }
}
