export class User {
  public isReady: boolean = false;
  public readonly joinedAt: number;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slot: number, // The "random/unique number 0<=n<max"
  ) {
    this.joinedAt = Date.now();
  }
}
