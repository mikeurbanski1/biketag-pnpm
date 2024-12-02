export interface PlayerScores {
    points: number;
    totalTagsPosted: number;
    newTagsPosted: number;
    tagsWon: number;
    tagsPostedOnTime: number;
}
export interface GameScore {
    playerScores: Record<string, PlayerScores>;
}

export interface TagStats {
    points: number;
    newTag: boolean;
    wonTag: boolean;
    postedOnTime: boolean;
}
