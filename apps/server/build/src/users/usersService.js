"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const users = [];
class UsersService {
    get(id) {
        return users.find((user) => user.id === id);
    }
    getAll() {
        return users;
    }
    create(userCreationParams) {
        const user = Object.assign({ id: Math.floor(Math.random() * 10000) }, userCreationParams);
        users.push(user);
        return user;
    }
}
exports.UsersService = UsersService;
