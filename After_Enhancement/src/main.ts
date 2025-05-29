import { Viewer } from './Viewer';

const container = document.getElementById('viewer-container');
if (!container) {
    throw new Error('Container element not found');
}

const viewer = new Viewer(container);
const switchModeBtn = document.getElementById('switch-mode-btn') as HTMLButtonElement;
const switchModeText = document.getElementById('switch-mode-text');
const switchModeIcon = document.getElementById('switch-mode-icon');
const zoomExtendButton = document.getElementById('zoom-extend');
const body = document.body;

let is2D = true;


function updateSwitchBtn() {
    if (is2D) {
        switchModeText!.textContent = 'Switch to 3D';
        switchModeIcon!.textContent = '🧱';
        body.classList.remove('mode-3d');
        body.classList.add('mode-2d');
    } else {
        switchModeText!.textContent = 'Switch to 2D';
        switchModeIcon!.textContent = '📐';
        body.classList.remove('mode-2d');
        body.classList.add('mode-3d');
    }
}


switchModeBtn?.addEventListener('click', () => {
    is2D = !is2D;  
    viewer.setView(is2D);  
    updateSwitchBtn();  
});


zoomExtendButton?.addEventListener('click', () => {
    viewer.zoomExtend();
});

updateSwitchBtn();