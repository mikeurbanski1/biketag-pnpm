import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { UsersService } from './usersService';
import { CreateUserParams, UserDto } from '@biketag/models';
import { UserEntity } from 'src/dal/models';

const logger = new Logger({ prefix: '[UsersController]' });

@Route('users')
export class UsersController extends Controller {
    private usersService = new UsersService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getUsers(): Promise<UserDto[]> {
        logger.info('[getUsers]');
        return (await this.usersService.getAll()).map(this.convertUserToDto);
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
        return this.convertUserToDto(user);
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
        return this.convertUserToDto(user);
    }

    @Post()
    @SuccessResponse('201', 'Created')
    public async createUser(@Body() requestBody: CreateUserParams): Promise<UserDto> {
        logger.info(`[createUser]`, { requestBody });
        const user = await this.usersService.create(requestBody);
        this.setStatus(201);
        return this.convertUserToDto(user);
    }

    private convertUserToDto(user: UserEntity): UserDto {
        return user;
    }
}
