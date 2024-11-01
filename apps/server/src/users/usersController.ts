// src/users/usersController.ts
import { Body, Controller, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { User } from '@biketag/models';
import { UsersService, UserCreationParams } from './usersService';

@Route('users')
export class UsersController extends Controller {
    @Get('/{userId}')
    public async getUser(@Path() userId: number): Promise<User> {
        const res = new UsersService().get(userId);
        if (res) {
            return res;
        } else {
            throw new Error('Not Found');
        }
    }

    @Get('/')
    public async getAllUsers(): Promise<User[]> {
        return new UsersService().getAll();
    }

    @SuccessResponse('201', 'Created') // Custom success response
    @Post('/')
    public async createUser(@Body() requestBody: UserCreationParams): Promise<User> {
        this.setStatus(201); // set return status 201
        return new UsersService().create(requestBody);
    }
}

