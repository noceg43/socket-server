export class SlotManager {
    private slots: (string | null)[];

    public toJSON(): any {
        return {
            slots: this.slots
        };
    }

    constructor(maxSlots: number) {
        this.slots = new Array(maxSlots).fill(null);
    }

    /*
     * Assigns the first available slot index to a user.
     * Returns the index or -1 if full.
     */
    public assignSlot(userId: string): number {
        // Check if user already has a slot
        const existingIndex = this.slots.indexOf(userId);
        if (existingIndex !== -1) return existingIndex;

        // Find all empty indices
        const emptyIndices: number[] = [];
        this.slots.forEach((val, idx) => {
            if (val === null) emptyIndices.push(idx);
        });

        if (emptyIndices.length === 0) return -1;

        // Pick random
        const randomIndex = Math.floor(Math.random() * emptyIndices.length);
        const slot = emptyIndices[randomIndex];

        this.slots[slot] = userId;
        return slot;
    }

    public releaseSlot(userId: string): void {
        const index = this.slots.indexOf(userId);
        if (index !== -1) {
            this.slots[index] = null;
        }
    }

    public getSlot(userId: string): number {
        return this.slots.indexOf(userId);
    }

    public getOccupiedSlots(): number {
        return this.slots.filter(s => s !== null).length;
    }
}
