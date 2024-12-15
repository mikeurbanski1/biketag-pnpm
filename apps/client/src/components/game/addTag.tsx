import { Dayjs } from 'dayjs';
import React, { useState } from 'react';

import { isEarlierDate, Logger } from '@biketag/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[AddTag]' });

interface AddTagProps {
    saveTag: ({ imageUrl }: { imageUrl: string }) => void;
    isSubtag: boolean;
    // will be provided for a new root tag (if there is a previous root tag)
    // hacky workaround to allow testing of creating tags at different times
    previousRootTagDate?: Dayjs;
    dateOverride: Dayjs;
    setAddTagAsActive: () => void;
    isActive: boolean;
    isFirstTag: boolean;
}

export const AddTag: React.FC<AddTagProps> = ({ saveTag, previousRootTagDate, dateOverride, isSubtag, setAddTagAsActive, isActive, isFirstTag }) => {
    const [imageUrl, setImageUrl] = useState('');
    // const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

    // const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
    //     setDate(event.target.value);
    // };

    const canPostOnDate = !previousRootTagDate || !isEarlierDate(dateOverride, previousRootTagDate);

    const canSave = imageUrl.length > 0 && canPostOnDate;

    let text: string;
    if (isSubtag && isFirstTag) {
        text = 'Be the first to find this spot!';
    } else if (!isSubtag && isFirstTag) {
        text = 'Nobody has been anywhere yet. Get it started!';
    } else if (isSubtag) {
        text = 'Tag this spot!';
    } else {
        text = 'Tag the next spot!';
    }

    return (
        <div className={`tag ${isActive ? '' : 'clickable-tag'}`} onClick={isActive ? undefined : setAddTagAsActive}>
            <div className="add-tag">
                {text}
                <div>
                    <input type="text" placeholder="Image URL" className="tag-input" name="contents" onChange={(event) => setImageUrl(event.target.value)} value={imageUrl}></input>
                </div>
            </div>
            <div className="tag-details">
                <button disabled={!canSave} onClick={() => saveTag({ imageUrl })}>
                    Save
                </button>
            </div>
        </div>
    );
};
