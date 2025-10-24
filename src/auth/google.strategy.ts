import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  // ======================================================
  // 🔹 
  // ======================================================
  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('Google Profile:', profile); // 🔍 Debug kalau masih error

    const { name, emails, photos } = profile;

    const email = emails && emails.length > 0 ? emails[0].value : null;
    const photo = photos && photos.length > 0 ? photos[0].value : null;
    const username = name?.givenName || name?.familyName || 'UserGoogle';

    if (!email) {
      return done(new Error('Google account has no public email'), false);
    }

    const user = {
      email,
      username,
      picture: photo,
      accessToken,
    };

    done(null, user);
  }
}