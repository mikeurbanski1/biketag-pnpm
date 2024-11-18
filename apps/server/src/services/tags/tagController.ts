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
        logger.info('[getTag] result', { tag });
        return tag;
    }

    @Post('/')
    @SuccessResponse('201', 'Created')
    public async createTag(@Body() requestBody: CreateTagParams): Promise<TagDto> {
        logger.info(`[createTag]`, { requestBody });
        const tag = await this.tagsService.create(requestBody);
        return tag;
    }

    @Post('/multi')
    @SuccessResponse('201', 'Created')
    public async getMultipleTags(@Body() requestBody: string[]): Promise<Record<string, TagDto>> {
        logger.info(`[getMultipleTags]`, { requestBody });
        const tags = await this.tagsService.getMultiple({ ids: requestBody });
        logger.info('[getMultipleTags] got tags', { tags });
        return tags.reduce(
            (idMap, tag) => {
                idMap[tag.id] = tag;
                return idMap;
            },
            {} as Record<string, TagDto>
        );
    }

    @Get('/user/{userId}/in-chain/{tagId}')
    @SuccessResponse('200', 'Ok')
    public async userInTagChain(@Path() userId: string, @Path() tagId: string): Promise<boolean> {
        logger.info(`[userInTagChain]`, { userId, tagId });
        const res = await this.tagsService.userInTagChain({ userId, tagId });
        logger.info('[userInTagChain] got result', { res });
        return res;
    }
}
