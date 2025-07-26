import { User as UserType } from '@/types';
export declare class User implements UserType {
    readonly id: string;
    readonly name: string;
    constructor(id: string, name: string);
    static fromUserData(userData: unknown): User;
    static fromRequestData(userId: string, body?: {
        name?: string;
    }): User;
}
export default User;
//# sourceMappingURL=user.d.ts.map