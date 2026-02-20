import * as fs from 'fs';
import * as path from 'path';

export interface ILogger {
    logEvent(tag: string, event: { type: string; payload?: any }): void;
    logStateChange(from: string, to: string): void;
    logError(message: string): void;
}

export class FileLogger implements ILogger {
    private logFilePath: string | null;

    constructor(logFileName?: string) {
        if (logFileName) {
            this.logFilePath = path.join(process.cwd(), logFileName);
            // Overwrite/Clear file on session start
            fs.writeFileSync(this.logFilePath, '');
        } else {
            this.logFilePath = null;
        }
    }

    private getTimeStamp(): string {
        return new Date().toISOString();
    }

    private writeToFile(message: string): void {
        if (this.logFilePath) {
            fs.appendFileSync(this.logFilePath, message + '\n');
        }
    }

    public logEvent(tag: string, event: { type: string; payload?: any }): void {
        const msg = `[${this.getTimeStamp()}] [${tag}] [EVENT] -> ${event.type} ${JSON.stringify(event.payload)}`;
        console.log(`\x1b[36m${msg}\x1b[0m`); // Cyan for events
        this.writeToFile(msg);
    }

    public logStateChange(from: string, to: string): void {
        const msg = `[${this.getTimeStamp()}] [STATE-CHANGE] ${from} -> ${to}`;
        console.log(`\x1b[33m${msg}\x1b[0m`); // Yellow for state changes
        this.writeToFile(msg);
    }

    public logError(message: string): void {
        const msg = `[${this.getTimeStamp()}] [ERROR] ${message}`;
        console.error(`\x1b[31m${msg}\x1b[0m`); // Red for errors
        this.writeToFile(msg);
    }
}

export class NoOpLogger implements ILogger {
    logEvent(): void { }
    logStateChange(): void { }
    logError(): void { }
}
