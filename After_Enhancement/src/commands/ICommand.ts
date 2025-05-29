
export interface ICommand {
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
    execute(): void;
}