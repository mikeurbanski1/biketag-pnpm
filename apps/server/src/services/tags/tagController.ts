import dayjs from 'dayjs';
import { Body, Controller, Get, Header, Path, Post, Query, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';

import { CreateTagDto, TagDto } from '@biketag/models';
import { Logger, USER_ID_HEADER } from '@biketag/utils';

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
    public async createTag(@Body() requestBody: CreateTagDto, @Header(USER_ID_HEADER) userId: string): Promise<TagDto> {
        logger.info(`[createTag]`, { userId, requestBody });
        const tag = await this.tagsService.create({ ...requestBody, creatorId: userId });
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

    @Get('/user/{userId}/game/{gameId}/can-post-new-tag')
    @SuccessResponse('200', 'Ok')
    public async canPostNewTag(@Path() userId: string, @Path() gameId: string, @Query('dateOverride') dateOverride?: string): Promise<{ result: boolean; reason?: string }> {
        logger.info(`[canPostNewTag]`, { userId, gameId });
        const res = await this.tagsService.canPostNewTag({ userId, gameId, dateOverride: dateOverride ? dayjs(dateOverride) : undefined });
        logger.info('[canPostNewTag] got result', { res });
        return res;
    }
}
