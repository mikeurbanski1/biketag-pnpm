import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { CreateTagParams, TagDto } from '@biketag/models';

import { TagService } from './tagService';

const logger = new Logger({ prefix: '[TagController]' });

@Route('tags')
export class TagController extends Controller {
    private tagsService = new TagService();

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getTag(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<TagDto> {
        logger.info(`[getTag] id: ${id}`);
        const tag = await this.tagsService.get({ id });
        if (!tag) {
            return notFoundResponse(404, { reason: 'Tag does not exist' });
        }
        logger.info(`[getTag] result ${tag}`);
        return tag;
    }

    @Post('/')
    @SuccessResponse('201', 'Created')
    public async createTag(@Body() requestBody: CreateTagParams): Promise<TagDto> {
        logger.info(`[createTag]`, { requestBody });
        const tag = await this.tagsService.create(requestBody);
        return tag;
    }
}
