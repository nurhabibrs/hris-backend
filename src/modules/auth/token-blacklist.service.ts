import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Set<string>();

  add(token: string, ttlMs = 24 * 60 * 60 * 1000): void {
    this.blacklist.add(token);
    setTimeout(() => this.blacklist.delete(token), ttlMs);
  }

  has(token: string): boolean {
    return this.blacklist.has(token);
  }
}
