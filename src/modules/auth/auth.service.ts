import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import UserService from '../user/user.service';
import BranchService from '../branch/branch.service';
import UserRoleService from '../user-role/user-role.service';
import { ROLE_ID_TO_NAME } from 'src/constants/auth.constants';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export default class AuthService {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly userService: UserService,
    private readonly branchService: BranchService,
    private jwt: JwtService,
  ) {}

  private async verifyRecaptcha(captchaToken: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing RECAPTCHA_SECRET_KEY');
  }


  const response = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    null,
    {
      params: {
        secret: secretKey,
        response: captchaToken,
      },
    },
  );

  return response.data.success === true;
}

  async login(userId: string, captchaToken: string) {
    const isHuman = await this.verifyRecaptcha(captchaToken);

if (!isHuman) {
  throw new UnauthorizedException('Captcha verification failed');
}
    const rows = await this.userRoleService.findRolesByUserId(userId);

    if (!rows.length) {
      throw new UnauthorizedException('no permissions');
    }

    // Get branch info for each role
    const branches = await this.branchService.getAllBranches();
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    const roles = rows.map((r) => ({
      role: ROLE_ID_TO_NAME[r.roleId] || 'UNKNOWN',
      roleId: r.roleId,
      branchId: r.resourceId as unknown as string,
      branchName: branchMap.get(r.resourceId as unknown as string)?.name || '',
    }));

    const activeBranch = roles[0]?.branchId || '';

    const payload = {
      sub: userId,
      roles,
      activeBranch,
    };

    const token = this.jwt.sign(payload);

    return {
      token,
      roles,
      activeBranch,
    };
  }

  async getMe(userId: string) {
    const [rows, user, branches] = await Promise.all([
      this.userRoleService.findRolesByUserId(userId),
      this.userService.findById(userId),
      this.branchService.getAllBranches(),
    ]);
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    const roles = rows.map((r) => ({
      role: ROLE_ID_TO_NAME[r.roleId] || 'UNKNOWN',
      roleId: r.roleId,
      branchId: r.resourceId as unknown as string,
      branchName: branchMap.get(r.resourceId as unknown as string)?.name || '',
    }));

    const activeBranch = roles[0]?.branchId || '';

    return { userId, name: user?.name || '', roles, activeBranch };
  }
}
