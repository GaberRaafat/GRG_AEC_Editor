
import type { WebGLRenderer } from "three";

export interface IDocument {
    /**

     * @param renderer 
     */
    render(renderer: WebGLRenderer): void;

    /**
     * @param e 
     */
    onMouseDown(e: MouseEvent): void;
    /**

     * @param e 
     */
    onMouseUp(e: MouseEvent): void;

    /**
     * @param e 
     */
    onMouseMove(e: MouseEvent): void;
    zoomFit(): void;
}