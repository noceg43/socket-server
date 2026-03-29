import { ILogger } from 'wth_logic';

export class ConsoleLogger implements ILogger {
    private getTimeStamp(): string {
        return new Date().toISOString();
    }

    public logEvent(tag: string, event: { type: string; payload?: any }): void {
        const msg = `[${this.getTimeStamp()}] [${tag}] [EVENT] -> ${event.type} ${JSON.stringify(event.payload)}`;
        console.log(`\x1b[36m${msg}\x1b[0m`); // Cyan for events
    }

    public logStateChange(from: string, to: string): void {
        const msg = `[${this.getTimeStamp()}] [STATE-CHANGE] ${from} -> ${to}`;
        console.log(`\x1b[33m${msg}\x1b[0m`); // Yellow for state changes
    }

    public logError(message: string): void {
        const msg = `[${this.getTimeStamp()}] [ERROR] ${message}`;
        console.error(`\x1b[31m${msg}\x1b[0m`); // Red for errors
    }
}
