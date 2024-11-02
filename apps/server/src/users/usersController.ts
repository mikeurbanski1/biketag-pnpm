// src/users/usersController.ts
import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { UsersService } from './usersService';
import { CreateUserParams, UserDto } from '@biketag/models';

const logger = new Logger({ prefix: '[UsersController]' });

@Route('users')
export class UsersController extends Controller {
    private usersService = new UsersService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getUsers(): Promise<UserDto[]> {
        return this.usersService.getUsers();
    }

    @Post('/login')
    @SuccessResponse('200', 'ok')
    public async login(@Body() requestBody: UserDto, @Res() invalidResponse: TsoaResponse<400, { reason: string }>): Promise<void> {
        const { id, name } = requestBody;
        logger.info(`[login] id: ${id}, name: ${name}`);

        const user = this.usersService.getUser({ id });
        logger.info(`[login] getUser result`, { user });
        if (!user || user.name !== name) {
            return invalidResponse(400, { reason: 'Incorrect name or ID' });
        }
        return;
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getUser(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<UserDto> {
        logger.info(`[getUser] id: ${id}`);
        const user = this.usersService.getUser({ id });
        if (!user) {
            return notFoundResponse(404, { reason: 'User does not exist' });
        }
        logger.info(`[getUser] result ${user}`);
        return user;
    }

    @Post()
    @SuccessResponse('201', 'Created') // Custom success response
    public async createUser(@Body() requestBody: CreateUserParams): Promise<UserDto> {
        logger.info(`[createUser]`, { requestBody });
        const user = this.usersService.createUser(requestBody);
        this.setStatus(201);
        return user;
    }
}
