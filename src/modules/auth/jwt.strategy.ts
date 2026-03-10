import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { TokenBlacklistService } from './token-blacklist.service';
import { JwtPayload } from '../../interfaces/jwt.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && this.tokenBlacklistService.has(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      photo_url: process.env.PATH_URL! + payload.photo_url,
      role: payload.role,
    };
  }
}
