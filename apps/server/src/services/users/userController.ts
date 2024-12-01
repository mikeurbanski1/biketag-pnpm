import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';

import { CreateUserParams, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { UserService } from './userService';

const logger = new Logger({ prefix: '[UserController]' });

@Route('users')
export class UserController extends Controller {
    private usersService = new UserService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getUsers(): Promise<UserDto[]> {
        logger.info('[getUsers]');
        return await this.usersService.getAll();
    }

    @Post('/login')
    @SuccessResponse('200', 'ok')
    public async login(@Body() requestBody: CreateUserParams, @Res() invalidResponse: TsoaResponse<400, { reason: string }>): Promise<UserDto> {
        logger.info('[login]', { user: requestBody });

        const user = await this.usersService.getUserByName(requestBody);
        logger.info(`[login] getUser result`, { user });
        if (!user) {
            return invalidResponse(400, { reason: 'Incorrect name' });
        }
        return user;
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getUser(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<UserDto> {
        logger.info(`[getUser] id: ${id}`);
        const user = await this.usersService.get({ id });
        if (!user) {
            return notFoundResponse(404, { reason: 'User does not exist' });
        }
        logger.info(`[getUser] result ${user}`);
        return user;
    }

    @Post()
    @SuccessResponse('201', 'Created')
    public async createUser(@Body() requestBody: CreateUserParams): Promise<UserDto> {
        logger.info(`[createUser]`, { requestBody });
        const user = await this.usersService.create(requestBody);
        return user;
    }
}
