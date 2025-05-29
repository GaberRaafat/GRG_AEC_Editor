

import { Camera, OrthographicCamera, PerspectiveCamera, WebGLRenderer } from "three";

class Resizer {
    /**
     * @param container -
     * @param camera 
     */
    constructor(container: HTMLElement, camera: Camera) {
        
        if (camera instanceof PerspectiveCamera) {
            camera.updateProjectionMatrix();
        }
        
       
        if (camera instanceof OrthographicCamera) {
            camera.updateProjectionMatrix();
        }
    }
}

export { Resizer } 